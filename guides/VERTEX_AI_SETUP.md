# Vertex AI Setup Guide for Gymzy

This guide will help you set up Google Cloud Vertex AI for the LangChain integration in Gymzy.

## Prerequisites

1. Google Cloud Platform (GCP) account
2. A GCP project with billing enabled
3. Node.js and npm installed

## Step 1: Enable Vertex AI API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Library"
4. Search for "Vertex AI API"
5. Click on "Vertex AI API" and then "Enable"

## Step 2: Create Service Account

1. In the Google Cloud Console, go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Enter a name (e.g., "gymzy-vertex-ai")
4. Add description: "Service account for Gymzy Vertex AI integration"
5. Click "Create and Continue"

## Step 3: Assign Roles

Assign the following roles to your service account:
- `Vertex AI User` (roles/aiplatform.user)
- `ML Developer` (roles/ml.developer) - Optional, for additional permissions

## Step 4: Create and Download Key

1. Click on your newly created service account
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" format
5. Click "Create" - this will download a JSON file

## Step 5: Set Up Environment Variables

1. Place the downloaded JSON file in a secure location (NOT in your project directory)
2. Add the following environment variables to your `.env.local` file:

```env
# Vertex AI Configuration
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# Alternative: Set credentials directly (less secure)
# GOOGLE_VERTEX_AI_CREDENTIALS={"type":"service_account",...}
```

## Step 6: Install Dependencies

The required LangChain packages should already be installed:

```bash
npm install @langchain/google-vertexai @langchain/core @langchain/langgraph langchain
```

## Step 7: Test the Setup

Create a test file to verify your setup:

```typescript
// test-vertex-ai.ts
import { ChatVertexAI } from '@langchain/google-vertexai';

async function testVertexAI() {
  try {
    const llm = new ChatVertexAI({
      modelName: "gemini-1.5-pro-preview-0409",
      temperature: 0.7,
    });

    const response = await llm.invoke("Hello, this is a test message.");
    console.log("✅ Vertex AI is working:", response.content);
  } catch (error) {
    console.error("❌ Vertex AI setup error:", error);
  }
}

testVertexAI();
```

Run the test:
```bash
npx tsx test-vertex-ai.ts
```

## Step 8: Security Best Practices

1. **Never commit credentials to version control**
2. **Use environment variables** for all sensitive data
3. **Restrict service account permissions** to minimum required
4. **Rotate keys regularly**
5. **Monitor usage** in Google Cloud Console

## Troubleshooting

### Common Issues:

1. **Authentication Error**
   - Verify `GOOGLE_APPLICATION_CREDENTIALS` path is correct
   - Ensure the service account has proper roles
   - Check that the JSON key file is valid

2. **API Not Enabled**
   - Ensure Vertex AI API is enabled in your GCP project
   - Wait a few minutes after enabling for propagation

3. **Quota Exceeded**
   - Check your Vertex AI quotas in Google Cloud Console
   - Request quota increases if needed

4. **Region Issues**
   - Ensure `GOOGLE_CLOUD_LOCATION` matches available regions
   - Use `us-central1` as a safe default

### Useful Commands:

```bash
# Check if credentials are working
gcloud auth application-default print-access-token

# List available models
gcloud ai models list --region=us-central1

# Check project configuration
gcloud config list
```

## Environment Variables Reference

```env
# Required
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GOOGLE_CLOUD_PROJECT=your-project-id

# Optional
GOOGLE_CLOUD_LOCATION=us-central1
VERTEX_AI_MODEL_NAME=gemini-1.5-pro-preview-0409
VERTEX_AI_TEMPERATURE=0.7
```

## Next Steps

Once Vertex AI is set up:

1. Test the LangChain agent in Gymzy
2. Monitor usage and costs in Google Cloud Console
3. Optimize model parameters for your use case
4. Set up monitoring and alerting

## Support

- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [LangChain Vertex AI Integration](https://js.langchain.com/docs/integrations/chat/google_vertex_ai)
- [Google Cloud Support](https://cloud.google.com/support)

## Cost Considerations

- Vertex AI charges per token/request
- Monitor usage in Google Cloud Console
- Set up billing alerts to avoid unexpected charges
- Consider using smaller models for development/testing

Remember to keep your credentials secure and never expose them in client-side code!
