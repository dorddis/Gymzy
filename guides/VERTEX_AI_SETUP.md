# Vertex AI Setup Guide for Local Development

This guide will help you set up your local environment to use Google Cloud Vertex AI with this project.

## Prerequisites

1.  **Google Cloud Account:** You need a Google Cloud Platform (GCP) account. If you don't have one, you can sign up at [cloud.google.com](https://cloud.google.com/). New accounts usually come with a free trial that includes credits applicable to Vertex AI.
2.  **Google Cloud Project:** Create or select an existing GCP project.
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project or select an existing one. Note your **Project ID**.
3.  **Enable Vertex AI API:**
    *   In the Cloud Console, navigate to "APIs & Services" > "Library".
    *   Search for "Vertex AI API" and enable it for your project.
    *   You might also need to enable the "Cloud Resource Manager API" if not already active.
4.  **Billing:** Ensure billing is enabled for your GCP project. While the free tier covers a certain amount of usage, billing must be enabled.

## Local Environment Setup

1.  **Install Google Cloud CLI (`gcloud`):**
    *   Follow the official instructions: [Install the gcloud CLI](https://cloud.google.com/sdk/docs/install).
    *   After installation, initialize the gcloud CLI:
        ```bash
        gcloud init
        ```
        This will guide you through logging in and selecting your project.

2.  **Application Default Credentials (ADC):**
    *   For local development, the easiest way to authenticate is by using Application Default Credentials.
    *   Log in with your user credentials:
        ```bash
        gcloud auth application-default login
        ```
        This command will open a browser window for you to authorize access. These credentials will be used by the LangChain Vertex AI integration.

3.  **Set Environment Variables (Recommended):**
    *   While ADC often works without explicitly setting the project ID in the environment for LangChain, it's good practice, especially if you work with multiple projects.
    *   You can set this in your shell environment (e.g., in `.bashrc`, `.zshrc`, or just for the current session):
        ```bash
        export GOOGLE_CLOUD_PROJECT="your-project-id"
        ```
        Replace `"your-project-id"` with your actual GCP Project ID.
    *   The LangChain Vertex AI integration might also look for `GCLOUD_PROJECT` or try to infer it.

## Using Vertex AI in the Project

*   The application uses `@langchain/google-vertexai` to interact with Vertex AI models (e.g., Gemini).
*   Ensure the necessary dependencies are installed (`npm install` or `yarn install` after pulling changes to `package.json`).
*   The code will typically initialize the Vertex AI LLM client without needing explicit API keys in the code, as it relies on the ADC setup above.

## Free Tier and Pricing

*   Vertex AI offers a free tier for its services, including Generative AI models.
*   **Important:** Monitor your usage to stay within the free tier limits if you want to avoid charges.
*   Refer to the official Vertex AI pricing page for details on the free tier and costs beyond that: [Vertex AI Pricing](https://cloud.google.com/vertex-ai/pricing#generative_ai_models) (The "Generative AI models" section is most relevant).

## Troubleshooting

*   **Permissions Errors:** If you encounter errors related to permissions, ensure your user account has the necessary IAM roles for Vertex AI (e.g., "Vertex AI User" or "Vertex AI Service Agent").
*   **API Not Enabled:** Double-check that the Vertex AI API is enabled in your GCP project.
*   **Authentication:** Ensure `gcloud auth application-default login` completed successfully and that `gcloud config list` shows your intended project.

This setup should allow the application to authenticate and use Vertex AI services from your local machine.
