// Test the new API routes for AI functionality
async function testAIGenerateAPI() {
  console.log('\n🧪 Testing AI Generate API Route...');
  
  try {
    const response = await fetch('http://localhost:9001/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt: 'Hello, this is a test message for the API route.' 
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ AI Generate API is working:');
    console.log('Response:', data.content);
    console.log('Response length:', data.content.length);
    
  } catch (error) {
    console.error('❌ AI Generate API error:', error);
  }
}

async function testAIConversationAPI() {
  console.log('\n🧪 Testing AI Conversation API Route...');
  
  try {
    const response = await fetch('http://localhost:9001/api/ai/conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        messages: [
          { role: 'user', content: 'Hello, this is a test conversation.' }
        ],
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ AI Conversation API is working:');
    console.log('Response:', data.content);
    console.log('Response length:', data.content.length);
    
  } catch (error) {
    console.error('❌ AI Conversation API error:', error);
  }
}

async function runTests() {
  console.log('🚀 Starting API Route Tests...');
  
  await testAIGenerateAPI();
  await testAIConversationAPI();
  
  console.log('\n🎉 All API route tests completed!');
}

runTests().catch(console.error);
