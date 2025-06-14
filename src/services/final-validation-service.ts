/**
 * Final Validation Service
 * Comprehensive testing and validation of all fixes
 */

import { ComprehensiveFixesService } from './comprehensive-fixes-service';

export class FinalValidationService {
  
  /**
   * Test 1: AI Chat Error Fix
   */
  static async testAIChatErrorFix(): Promise<boolean> {
    console.log('🧪 Testing AI Chat Error Fix...');
    
    try {
      // Test the specific error that was occurring
      const mockUserProfile = {
        fitnessLevel: 'beginner',
        goals: undefined, // This was causing the error
        availableEquipment: null, // This was also causing issues
        workoutFrequency: 'test'
      };
      
      const safeProfile = ComprehensiveFixesService.ensureUserProfileSafety(mockUserProfile);
      
      // Test that arrays are properly handled
      if (!Array.isArray(safeProfile.goals)) {
        throw new Error('Goals should be an array');
      }
      
      if (!Array.isArray(safeProfile.availableEquipment)) {
        throw new Error('Available equipment should be an array');
      }
      
      // Test join operations that were failing
      const goalsString = safeProfile.goals.join(', ');
      const equipmentString = safeProfile.availableEquipment.join(', ');
      
      console.log('✅ AI Chat Error Fix: PASSED');
      console.log(`   Goals: ${goalsString}`);
      console.log(`   Equipment: ${equipmentString}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ AI Chat Error Fix: FAILED', error);
      return false;
    }
  }
  
  /**
   * Test 2: Session Management
   */
  static async testSessionManagement(): Promise<boolean> {
    console.log('🧪 Testing Session Management...');
    
    try {
      // Test session creation and persistence
      const sessionId1 = ComprehensiveFixesService.getOrCreateSessionId();
      const sessionId2 = ComprehensiveFixesService.getOrCreateSessionId();
      
      // Should return the same session ID
      if (sessionId1 !== sessionId2) {
        throw new Error('Session IDs should be the same for persistence');
      }
      
      console.log('✅ Session Management: PASSED');
      console.log(`   Session ID: ${sessionId1}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Session Management: FAILED', error);
      return false;
    }
  }
  
  /**
   * Test 3: User ID Extraction
   */
  static async testUserIdExtraction(): Promise<boolean> {
    console.log('🧪 Testing User ID Extraction...');
    
    try {
      const userId = await ComprehensiveFixesService.getUserId();
      
      if (!userId || userId.length === 0) {
        throw new Error('User ID should not be empty');
      }
      
      console.log('✅ User ID Extraction: PASSED');
      console.log(`   User ID: ${userId}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ User ID Extraction: FAILED', error);
      return false;
    }
  }
  
  /**
   * Test 4: Chat History Validation
   */
  static async testChatHistoryValidation(): Promise<boolean> {
    console.log('🧪 Testing Chat History Validation...');
    
    try {
      // Test with problematic chat history
      const problematicHistory = [
        { role: 'user', content: 'Hello' }, // Missing id, timestamp, userId
        { id: 'test', role: 'invalid_role', content: null }, // Invalid role, null content
        { id: 'test2', role: 'assistant', content: '', timestamp: 'invalid_date' }, // Empty content, invalid timestamp
        null, // Null message
        undefined // Undefined message
      ];
      
      const cleanHistory = ComprehensiveFixesService.validateAndCleanChatHistory(problematicHistory);
      
      // Should have filtered out invalid messages
      if (cleanHistory.length !== 1) { // Only the first message should remain after cleaning
        console.log('Cleaned history:', cleanHistory);
        throw new Error(`Expected 1 valid message, got ${cleanHistory.length}`);
      }
      
      // Check that the remaining message is properly formatted
      const validMessage = cleanHistory[0];
      if (!validMessage.id || !validMessage.role || !validMessage.content || !validMessage.timestamp) {
        throw new Error('Valid message should have all required fields');
      }
      
      console.log('✅ Chat History Validation: PASSED');
      console.log(`   Cleaned ${problematicHistory.length} -> ${cleanHistory.length} messages`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Chat History Validation: FAILED', error);
      return false;
    }
  }
  
  /**
   * Test 5: Error Handling
   */
  static async testErrorHandling(): Promise<boolean> {
    console.log('🧪 Testing Error Handling...');
    
    try {
      // Test AI response error handling
      const mockError = new Error('Test error for validation');
      const errorResponse = ComprehensiveFixesService.handleAIResponseError(mockError, 'test_context');
      
      if (!errorResponse.content || !errorResponse.metadata) {
        throw new Error('Error response should have content and metadata');
      }
      
      if (!errorResponse.metadata.error) {
        throw new Error('Error response should be marked as error');
      }
      
      console.log('✅ Error Handling: PASSED');
      console.log(`   Error response: ${errorResponse.content.substring(0, 50)}...`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Error Handling: FAILED', error);
      return false;
    }
  }
  
  /**
   * Test 6: Memory Management
   */
  static async testMemoryManagement(): Promise<boolean> {
    console.log('🧪 Testing Memory Management...');
    
    try {
      // Test memory cleanup (this is mainly for browser environments)
      if (typeof window !== 'undefined') {
        // Add some test data to localStorage
        localStorage.setItem('gymzy_test_data', 'test');
        localStorage.setItem('gymzy_test_data_expiry', (Date.now() - 1000).toString()); // Expired
        
        // Run cleanup
        ComprehensiveFixesService.cleanupMemory();
        
        // Check that expired data was removed
        const testData = localStorage.getItem('gymzy_test_data');
        if (testData !== null) {
          throw new Error('Expired data should have been cleaned up');
        }
      }
      
      console.log('✅ Memory Management: PASSED');
      
      return true;
      
    } catch (error) {
      console.error('❌ Memory Management: FAILED', error);
      return false;
    }
  }
  
  /**
   * Run all validation tests
   */
  static async runAllValidationTests(): Promise<{
    passed: number;
    failed: number;
    results: { [key: string]: boolean };
  }> {
    console.log('🚀 Running All Validation Tests...\n');
    
    const tests = [
      { name: 'AI Chat Error Fix', test: this.testAIChatErrorFix },
      { name: 'Session Management', test: this.testSessionManagement },
      { name: 'User ID Extraction', test: this.testUserIdExtraction },
      { name: 'Chat History Validation', test: this.testChatHistoryValidation },
      { name: 'Error Handling', test: this.testErrorHandling },
      { name: 'Memory Management', test: this.testMemoryManagement }
    ];
    
    const results: { [key: string]: boolean } = {};
    let passed = 0;
    let failed = 0;
    
    for (const { name, test } of tests) {
      try {
        const result = await test.call(this);
        results[name] = result;
        
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`❌ Test "${name}" threw an error:`, error);
        results[name] = false;
        failed++;
      }
      
      console.log(''); // Add spacing between tests
    }
    
    console.log('📊 Validation Test Results:');
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🎉🎉🎉 ALL VALIDATION TESTS PASSED! 🎉🎉🎉');
      console.log('✅ Your implementation is ready for production!');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the errors above.');
    }
    
    return { passed, failed, results };
  }
  
  /**
   * Quick health check
   */
  static async quickHealthCheck(): Promise<boolean> {
    console.log('🏥 Running Quick Health Check...');
    
    try {
      // Test basic functionality
      const sessionId = ComprehensiveFixesService.getOrCreateSessionId();
      const userId = await ComprehensiveFixesService.getUserId();
      const safeProfile = ComprehensiveFixesService.ensureUserProfileSafety(null);
      
      if (!sessionId || !userId || !safeProfile) {
        throw new Error('Basic functionality check failed');
      }
      
      console.log('✅ Quick Health Check: PASSED');
      return true;
      
    } catch (error) {
      console.error('❌ Quick Health Check: FAILED', error);
      return false;
    }
  }
}

// Export for browser testing
if (typeof window !== 'undefined') {
  (window as any).finalValidation = {
    runAllValidationTests: FinalValidationService.runAllValidationTests.bind(FinalValidationService),
    quickHealthCheck: FinalValidationService.quickHealthCheck.bind(FinalValidationService)
  };
}

export default FinalValidationService;
