# Setting Up Your New Deepgram API Key for 50MB Support

## Environment Variable Setup

Add your new Deepgram API key to your environment variables:

### For Local Development (.env.local):
\`\`\`
DEEPGRAM_API_KEY=your_new_deepgram_api_key_here
\`\`\`

### For Vercel Deployment:
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add: `DEEPGRAM_API_KEY` = `your_new_deepgram_api_key_here`
5. Deploy your changes

## Verification Steps

1. **Test API Key Status**: Visit `/diagnostics` page to verify your new API key
2. **Check File Size Support**: The system now supports files up to 50MB
3. **Monitor Usage**: Check your Deepgram dashboard for usage and billing

## File Size Routing

- **Files < 4MB**: Processed via server route (fast)
- **Files 4MB-50MB**: Direct Deepgram API (requires your new API key)
- **Files > 50MB**: Contact support for enterprise solutions

## Features Enabled with New API Key

✅ Enhanced file size support (up to 50MB)
✅ Advanced sentiment analysis
✅ Topic detection and intent recognition
✅ Real-time processing for medium files
✅ Professional-grade transcription accuracy

## Troubleshooting

If you encounter issues:
1. Verify the API key is correctly set in environment variables
2. Check your Deepgram account has sufficient credits
3. Ensure your account supports the enhanced file size limits
4. Contact Deepgram support for account-specific questions
\`\`\`
</QuickEdit>
