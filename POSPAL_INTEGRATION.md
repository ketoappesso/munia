# Pospal API Integration for Appesso Coffee Balance

## Overview
This integration connects the Munia wallet page to the Pospal POS system to display real-time Appesso coffee shop balances.

## Configuration Complete ✅

### What's Been Set Up:

1. **Pospal API Client** (`src/lib/pospal/client.ts`)
   - Simplified to use only the main store (总店/ZD)
   - Phone number lookup only (no member number support)
   - Returns 0 if customer not found or on error
   - Hardcoded App ID: `425063AC22F21CCD8E293004DDD8DA95`

2. **Wallet API Updated** (`src/app/api/wallet/route.ts`)
   - Fetches Appesso balance from Pospal API
   - Uses user's phone number for lookup
   - Gracefully handles errors (returns 0 balance)

3. **Environment Variables**
   - Added `POSPAL_ZD_APPKEY` to `.env.local`
   - Updated `.env.example` and `.env.local.example` with documentation

4. **Test Script** (`test-pospal.js`)
   - Standalone script to test API connection
   - Verifies phone number lookup works correctly

## ⚠️ Required: Add Your API Key

You need to get the API key from your `appesso-backend-server` and add it to `.env.local`:

### Step 1: Find Your API Key

The API key is stored in your backend server's environment. Look for:
- Environment variable name: `PASPAL_ZD` 
- Location: Your backend server's `.env` file or deployment configuration
- Format: Should be a 32-character string

### Step 2: Add to .env.local

```bash
# Edit .env.local
POSPAL_ZD_APPKEY=your_actual_api_key_here
```

### Step 3: Test the Connection

```bash
# Test with a known phone number
node test-pospal.js 13812345678
```

If successful, you should see customer details including balance.

### Step 4: Restart Your App

```bash
npm run dev
```

## How It Works

1. **User logs into wallet page**
2. **Wallet API is called** (`/api/wallet`)
3. **API checks for user's phone number** in database
4. **If phone exists, queries Pospal API** for customer balance
5. **Balance is displayed** on the Appesso Coffee card

## Features

- ✅ Real-time balance from Pospal POS
- ✅ Main store (总店) only
- ✅ Phone number lookup
- ✅ Includes subsidy balance
- ✅ Graceful error handling
- ✅ Returns 0 if no customer found

## Troubleshooting

### API Key Not Working
1. Verify the key matches exactly from backend server
2. Check it's for the main store (ZD)
3. Run test script: `node test-pospal.js <phone_number>`

### Balance Shows 0
1. User may not have phone number in database
2. Phone number may not be registered in Pospal
3. API key may be incorrect
4. Check console logs for errors

### Testing Without API Key
The system will work without the API key but will always show 0 balance for Appesso Coffee.

## API Details

- **Base URL**: `https://area20-win.pospal.cn/pospal-api2/openapi/v1`
- **Endpoint**: `customerOpenapi/queryBytel`
- **Method**: POST
- **Authentication**: MD5 signature with app key
- **Main Store App ID**: `425063AC22F21CCD8E293004DDD8DA95`

## Files Modified

1. `/src/lib/pospal/client.ts` - Pospal API client
2. `/src/app/api/wallet/route.ts` - Wallet API endpoint
3. `/src/app/api/wallet/appesso-balance/route.ts` - Dedicated Appesso balance endpoint (optional)
4. `/.env.local` - Environment variables
5. `/.env.example` - Environment variable documentation
6. `/.env.local.example` - Local environment variable documentation
7. `/test-pospal.js` - Test script for API connection

## Next Steps

After adding your API key:
1. Test with known customer phone numbers
2. Verify balances match POS system
3. Monitor console for any errors
4. Consider adding caching if needed for performance
