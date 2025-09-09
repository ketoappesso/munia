# Appesso-Appesso Balance Transfer System

## Overview
This document describes the balance transfer system between Appesso (APE tokens) and Appesso Coffee balance, implemented through the Pospal POS API integration.

## System Architecture

### Components
1. **Appesso Wallet** - APE token balance stored in the Appesso database
2. **Appesso Balance** - Coffee shop balance stored in Pospal POS system
3. **Transfer API** - Bidirectional transfer endpoint for moving funds

### Prerequisites
- User must have a phone number linked to their Appesso account
- Phone number must be registered in the Appesso/Pospal system
- Valid Pospal API key configured in environment variables

## Configuration

### Environment Variables
Add to `.env.local`:
```env
POSPAL_ZD_APPKEY=your_api_key_here
```

### API Credentials
- **App ID**: `425063AC22F21CCD8E293004DDD8DA95` (Main Store/总店)
- **API Base URL**: `https://area20-win.pospal.cn/pospal-api2/openapi/v1`

## API Endpoints

### 1. Check Transfer Eligibility
```http
GET /api/wallet/transfer
```

**Response:**
```json
{
  "eligible": true,
  "apeBalance": 100,
  "appessoBalance": 211.35,
  "customerInfo": {
    "name": "Customer Name",
    "memberNumber": "12345678",
    "phoneNumber": "18874748888"
  }
}
```

### 2. Perform Transfer
```http
POST /api/wallet/transfer
```

**Request Body:**
```json
{
  "direction": "TO_APPESSO",  // or "FROM_APPESSO"
  "amount": 50,
  "description": "Transfer to coffee account"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "transaction_id",
    "type": "TRANSFER",
    "amount": 50,
    "direction": "TO_APPESSO",
    "status": "COMPLETED"
  },
  "balances": {
    "apeBalance": 50,
    "appessoBalance": 261.35
  }
}
```

## Transfer Directions

### TO_APPESSO (APE → Appesso)
1. Deducts APE balance from user's Appesso wallet
2. Adds equivalent amount to Appesso balance via Pospal API
3. Records transaction in database

### FROM_APPESSO (Appesso → APE)
1. Deducts balance from Appesso account via Pospal API
2. Adds equivalent APE tokens to user's Appesso wallet
3. Records transaction in database

## Implementation Details

### Files Modified/Created

1. **`src/lib/pospal/client.ts`**
   - Added `updateBalanceAndPoints()` method for balance modifications
   - Handles BigInt customer UIDs properly
   - Uses json-bigint for proper serialization

2. **`src/app/api/wallet/transfer/route.ts`**
   - Main transfer endpoint
   - Handles both transfer directions
   - Implements transaction safety with database transactions

3. **`src/app/api/wallet/route.ts`**
   - Updated to fetch and display Appesso balance
   - Shows both APE and Appesso balances in wallet

4. **`src/app/(protected)/wallet/page.tsx`**
   - Displays dual balance cards (APE and Appesso)
   - Shows transfer animations between cards

## Testing

### Test Scripts

1. **`test-pospal.js`** - Tests Pospal connection and balance query
   ```bash
   node test-pospal.js 18874748888
   ```

2. **`test-transfer.js`** - Tests complete transfer cycle
   ```bash
   node test-transfer.js 18874748888 10
   ```

### Test Results
✅ Successfully queries customer balance from Pospal
✅ Successfully adds balance to Appesso account
✅ Successfully reduces balance from Appesso account
✅ Balance changes are immediately reflected in queries
✅ Handles BigInt customer UIDs correctly

## Security Considerations

1. **Authentication Required** - All transfer endpoints require authenticated user
2. **Phone Number Verification** - Transfers only allowed for verified phone numbers
3. **Balance Validation** - Prevents overdrafts with balance checks
4. **Transaction Atomicity** - Uses database transactions for consistency
5. **API Key Security** - Sensitive keys stored in environment variables

## Error Handling

### Common Errors
- **Phone number not linked** - User needs to update profile
- **Appesso account not found** - Phone number not registered in Pospal
- **Insufficient balance** - Not enough funds for transfer
- **API errors** - Pospal service unavailable or rate limited

## Business Rules
As per the provided rule:
- When a task is issued, the amount is immediately deducted from balance
- If a task fails, the system refunds 50% of the remaining payment
- This ensures balance accuracy during simultaneous claims

## Future Enhancements

1. **UI Integration** - Add transfer buttons to wallet page
2. **Transfer History** - Display transaction history in UI
3. **Rate Limiting** - Implement transfer limits and cooldowns
4. **Multi-Store Support** - Extend to other Appesso store locations
5. **Notification System** - Alert users of successful transfers
6. **Batch Transfers** - Support bulk transfer operations

## Maintenance

### Monitoring
- Check Pospal API availability regularly
- Monitor failed transfer attempts
- Track balance discrepancies

### Updates
- Keep Pospal API credentials current
- Update BigInt handling as Node.js evolves
- Maintain compatibility with Pospal API changes

## Support

For issues or questions:
1. Check test scripts for diagnostics
2. Verify API key configuration
3. Ensure phone number is registered in both systems
4. Review transaction logs for errors
