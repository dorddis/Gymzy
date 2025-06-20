// test-groq.ts
import { ChatGroq } from '@langchain/groq';
import { generateAIResponse, generateCharacterStreamingResponse } from '../../services/groq-service';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testGroqDirect() {
  console.log('🧪 Testing Groq Direct API...');
  
  try {
    console.log("🔧 Environment check:");
    console.log("- NEXT_PUBLIC_GROQ_API_KEY set:", !!process.env.NEXT_PUBLIC_GROQ_API_KEY);
    console.log("- NEXT_PUBLIC_GROQ_MODEL_NAME:", process.env.NEXT_PUBLIC_GROQ_MODEL_NAME);

    const response = await generateAIResponse("Hello, this is a test message. Please respond with a brief greeting.");
    console.log("✅ Groq Direct API is working:");
    console.log("Response:", response);
    console.log("Response length:", response.length);
    
  } catch (error) {
    console.error("❌ Groq Direct API error:", error);
  }
}

async function testGroqLangChain() {
  console.log('\n🧪 Testing Groq via LangChain...');
  
  try {
    const llm = new ChatGroq({
      model: process.env.NEXT_PUBLIC_GROQ_MODEL_NAME || "llama3-70b-8192",
      temperature: 0.7,
      apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    });

    const response = await llm.invoke("Hello, this is a LangChain test message. Please respond with a brief greeting.");
    console.log("✅ Groq LangChain is working:");
    console.log("Response:", response.content);
    console.log("Response length:", response.content.length);
    
  } catch (error) {
    console.error("❌ Groq LangChain error:", error);
  }
}

async function testGroqStreaming() {
  console.log('\n🧪 Testing Groq Streaming...');
  
  try {
    let streamedContent = '';
    let chunkCount = 0;
    
    const response = await generateCharacterStreamingResponse(
      "Tell me a very short joke about fitness.",
      (chunk: string) => {
        streamedContent += chunk;
        chunkCount++;
        process.stdout.write(chunk); // Show streaming in real-time
      },
      () => {
        console.log(`\n✅ Groq Streaming completed!`);
        console.log(`Total chunks received: ${chunkCount}`);
        console.log(`Total content length: ${streamedContent.length}`);
      },
      (error: string) => {
        console.error(`❌ Streaming error: ${error}`);
      }
    );
    
  } catch (error) {
    console.error("❌ Groq Streaming error:", error);
  }
}

async function testGroqPerformance() {
  console.log('\n🧪 Testing Groq Performance...');
  
  try {
    const startTime = Date.now();
    
    const response = await generateAIResponse("What is 2+2? Give a very brief answer.");
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log("✅ Groq Performance Test:");
    console.log(`Response: ${response}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Speed: ${response.length / (duration / 1000)} chars/second`);
    
  } catch (error) {
    console.error("❌ Groq Performance test error:", error);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Groq Integration Tests...\n');
  
  await testGroqDirect();
  await testGroqLangChain();
  await testGroqStreaming();
  await testGroqPerformance();
  
  console.log('\n🎉 All Groq tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export {
  testGroqDirect,
  testGroqLangChain,
  testGroqStreaming,
  testGroqPerformance,
  runAllTests
};
