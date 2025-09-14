// Use the WebSocket server's Prisma client
const prismaClient = require('./prisma');

class FacegateScheduler {
  constructor(gateway) {
    this.gateway = gateway;
    this.timers = [];
    this.running = false;
  }

  start() {
    if (this.running) return;
    this.running = true;

    // Create jobs from schedules every 10 seconds
    this.timers.push(
      setInterval(() => this.createJobsFromSchedules(), 10 * 1000)
    );

    // Dispatch pending jobs every 5 seconds
    this.timers.push(
      setInterval(() => this.dispatchPendingJobs(), 5 * 1000)
    );

    // Requeue failed jobs every 30 seconds
    this.timers.push(
      setInterval(() => this.requeueFailedJobs(), 30 * 1000)
    );

    console.log('Facegate scheduler started');
  }

  stop() {
    this.running = false;
    this.timers.forEach(timer => clearInterval(timer));
    this.timers = [];
    console.log('Facegate scheduler stopped');
  }

  isWithinWindow(startAt, endAt) {
    const now = Date.now();
    const start = new Date(startAt).getTime();
    const end = endAt ? new Date(endAt).getTime() : null;
    return now >= start && (!end || now <= end);
  }

  matchCronField(part, val, min, max) {
    if (part === '*') return true;
    if (part.startsWith('*/')) {
      const step = Number(part.slice(2));
      if (!step) return false;
      return (val - min) % step === 0;
    }
    if (part.includes(',')) {
      return part.split(',').some(p => this.matchCronField(p.trim(), val, min, max));
    }
    const num = Number(part);
    if (Number.isNaN(num)) return false;
    return num === val;
  }

  isCronDue(cron, date) {
    try {
      const parts = String(cron).trim().split(/\s+/);
      if (parts.length < 5) return true;

      const [min, hour, dom, mon, dow] = parts;
      const m = date.getMinutes();
      const h = date.getHours();
      const D = date.getDate();
      const M = date.getMonth() + 1;
      const W = date.getDay();

      return (
        this.matchCronField(min, m, 0, 59) &&
        this.matchCronField(hour, h, 0, 23) &&
        this.matchCronField(dom, D, 1, 31) &&
        this.matchCronField(mon, M, 1, 12) &&
        this.matchCronField(dow, W, 0, 6)
      );
    } catch {
      return true;
    }
  }

  async createJobsFromSchedules() {
    try {
      const schedules = await prismaClient.facegateSchedule.findMany({
        where: { status: { in: [0, 1] } },
        include: { targets: true },
        take: 200
      });

      for (const schedule of schedules) {
        const within = this.isWithinWindow(schedule.startAt, schedule.endAt);
        const cronOk = schedule.cron ? this.isCronDue(schedule.cron, new Date()) : true;

        if (!(within && cronOk)) continue;
        if (!schedule.targets.length) continue;

        for (const target of schedule.targets) {
          // Check if job already exists
          if (!schedule.cron) {
            const existingJob = await prismaClient.facegateJob.findFirst({
              where: {
                scheduleId: schedule.id,
                deviceId: target.deviceId
              }
            });
            if (existingJob) continue;
          } else {
            // For cron jobs, check if created recently
            const since = new Date(Date.now() - 55 * 1000);
            const recentJob = await prismaClient.facegateJob.findFirst({
              where: {
                scheduleId: schedule.id,
                deviceId: target.deviceId,
                updatedAt: { gte: since }
              }
            });
            if (recentJob) continue;
          }

          // Create new job
          await prismaClient.facegateJob.create({
            data: {
              scheduleId: schedule.id,
              deviceId: target.deviceId,
              state: 'pending'
            }
          });
        }
      }
    } catch (err) {
      console.error('createJobsFromSchedules error:', err);
    }
  }

  async dispatchPendingJobs() {
    try {
      const jobs = await prismaClient.facegateJob.findMany({
        where: { state: 'pending' },
        include: {
          schedule: {
            include: { image: true }
          }
        },
        take: 50
      });

      for (const job of jobs) {
        const ws = this.gateway.connections.get(job.deviceId);
        if (!ws) continue; // Device offline

        try {
          if (job.schedule.payloadType === 'image' && job.schedule.image) {
            // Build image URL
            const imageUrl = `/facegate/images/${job.schedule.image.fileName}`;
            await this.gateway.pushDisplayImage(job.deviceId, imageUrl);
          } else if (job.schedule.payloadType === 'face') {
            // Handle face sync
            await this.gateway.pushChangePersons(job.deviceId, {
              InsertPersons: [], // To be implemented based on requirements
              UpdatePersons: [],
              RemovePersons: []
            });
          }

          // Mark job as sent
          await prismaClient.facegateJob.update({
            where: { id: job.id },
            data: { state: 'sent' }
          });
        } catch (err) {
          console.error(`Failed to dispatch job ${job.id}:`, err);
          await prismaClient.facegateJob.update({
            where: { id: job.id },
            data: {
              state: 'failed',
              retryCount: { increment: 1 },
              lastError: err.message || 'Send failed'
            }
          });
        }
      }
    } catch (err) {
      console.error('dispatchPendingJobs error:', err);
    }
  }

  async requeueFailedJobs() {
    try {
      const threshold = new Date(Date.now() - 30 * 1000);
      const failedJobs = await prismaClient.facegateJob.findMany({
        where: {
          state: 'failed',
          updatedAt: { lt: threshold },
          retryCount: { lt: 3 }
        },
        take: 100
      });

      for (const job of failedJobs) {
        await prismaClient.facegateJob.update({
          where: { id: job.id },
          data: { state: 'pending' }
        });
      }
    } catch (err) {
      console.error('requeueFailedJobs error:', err);
    }
  }
}

module.exports = { FacegateScheduler };