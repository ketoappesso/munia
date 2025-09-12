// Mock database for testing when MySQL is not available
const persons = [];
const devices = [];
const records = [];

module.exports = {
  async query(sql, params) {
    console.log('Mock DB Query:', sql);
    
    if (sql.includes('SELECT * FROM persons')) {
      return [persons];
    }
    if (sql.includes('SELECT * FROM devices')) {
      return [devices];
    }
    if (sql.includes('SELECT * FROM records')) {
      return [records.slice(0, 20)];
    }
    
    return [[]];
  },
  
  async execute(sql, params) {
    console.log('Mock DB Execute:', sql);
    
    if (sql.includes('INSERT INTO persons')) {
      // params: [phone, person_name, picture_url, picture_file, ic_card_id, idcard_no, ...]
      const person = {
        phone: params[0],
        person_name: params[1],
        picture_url: params[2],
        picture_file: params[3],
        ic_card_id: params[4],
        idcard_no: params[5],
        updated_at: new Date().toISOString()
      };
      
      // Check if person exists
      const existingIndex = persons.findIndex(p => p.phone === person.phone);
      if (existingIndex >= 0) {
        // Update existing
        persons[existingIndex] = { ...persons[existingIndex], ...person };
      } else {
        // Add new
        persons.push(person);
      }
      
      return [{ affectedRows: 1 }];
    }
    
    if (sql.includes('DELETE FROM persons')) {
      const phone = params[0];
      const index = persons.findIndex(p => p.phone === phone);
      if (index >= 0) {
        persons.splice(index, 1);
      }
      return [{ affectedRows: 1 }];
    }
    
    if (sql.includes('UPDATE persons')) {
      // Handle updates
      return [{ affectedRows: 1 }];
    }
    
    return [{ affectedRows: 0 }];
  }
};