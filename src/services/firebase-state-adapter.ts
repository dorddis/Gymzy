/**
 * Firebase State Persistence Adapter
 * Implements StateStorageAdapter for Firebase Firestore
 */

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { StateStorageAdapter, ConversationState } from './agentic-state-manager';

export class FirebaseStateAdapter implements StateStorageAdapter {
  private readonly collectionName = 'conversation_states';

  /**
   * Load conversation state from Firebase
   */
  async loadState(sessionId: string): Promise<ConversationState | null> {
    try {
      console.log(`🔍 FirebaseStateAdapter: Loading state for session ${sessionId}`);
      
      const docRef = doc(db, this.collectionName, sessionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log(`✅ FirebaseStateAdapter: State loaded successfully for session ${sessionId}`);
        
        // Convert Firestore timestamps back to Date objects
        const state = this.deserializeState(data as any);
        return state;
      } else {
        console.log(`📭 FirebaseStateAdapter: No state found for session ${sessionId}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ FirebaseStateAdapter: Error loading state for session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Save conversation state to Firebase
   */
  async saveState(state: ConversationState): Promise<void> {
    try {
      console.log(`💾 FirebaseStateAdapter: Saving state for session ${state.sessionId}`);
      
      const docRef = doc(db, this.collectionName, state.sessionId);
      
      // Serialize state for Firestore (convert Dates to timestamps)
      const serializedState = this.serializeState(state);
      
      await setDoc(docRef, serializedState, { merge: true });
      
      console.log(`✅ FirebaseStateAdapter: State saved successfully for session ${state.sessionId}`);
    } catch (error) {
      console.error(`❌ FirebaseStateAdapter: Error saving state for session ${state.sessionId}:`, error);
      throw new Error(`Failed to save conversation state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete conversation state from Firebase
   */
  async deleteState(sessionId: string): Promise<void> {
    try {
      console.log(`🗑️ FirebaseStateAdapter: Deleting state for session ${sessionId}`);
      
      const docRef = doc(db, this.collectionName, sessionId);
      await deleteDoc(docRef);
      
      console.log(`✅ FirebaseStateAdapter: State deleted successfully for session ${sessionId}`);
    } catch (error) {
      console.error(`❌ FirebaseStateAdapter: Error deleting state for session ${sessionId}:`, error);
      throw new Error(`Failed to delete conversation state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all conversation states for a user
   */
  async getUserStates(userId: string): Promise<ConversationState[]> {
    try {
      console.log(`🔍 FirebaseStateAdapter: Loading all states for user ${userId}`);
      
      // Note: This would require a compound query in production
      // For now, we'll implement a simple approach
      // In production, you'd want to add a userId field and create an index
      
      console.log(`⚠️ FirebaseStateAdapter: getUserStates not fully implemented - requires Firestore compound queries`);
      return [];
    } catch (error) {
      console.error(`❌ FirebaseStateAdapter: Error loading user states for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Serialize state for Firestore storage
   */
  private serializeState(state: ConversationState): any {
    return {
      ...state,
      metadata: {
        ...state.metadata,
        createdAt: state.metadata.createdAt,
        lastUpdated: state.metadata.lastUpdated
      },
      context: {
        ...state.context,
        conversationHistory: state.context.conversationHistory.map(msg => ({
          ...msg,
          timestamp: msg.timestamp
        })),
        currentTask: state.context.currentTask ? {
          ...state.context.currentTask,
          startedAt: state.context.currentTask.startedAt,
          completedAt: state.context.currentTask.completedAt,
          steps: state.context.currentTask.steps.map(step => ({
            ...step,
            startedAt: step.startedAt,
            completedAt: step.completedAt
          }))
        } : null
      }
    };
  }

  /**
   * Deserialize state from Firestore
   */
  private deserializeState(data: any): ConversationState {
    return {
      ...data,
      metadata: {
        ...data.metadata,
        createdAt: data.metadata.createdAt?.toDate?.() || new Date(data.metadata.createdAt),
        lastUpdated: data.metadata.lastUpdated?.toDate?.() || new Date(data.metadata.lastUpdated)
      },
      context: {
        ...data.context,
        conversationHistory: (data.context.conversationHistory || []).map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp?.toDate?.() || new Date(msg.timestamp)
        })),
        currentTask: data.context.currentTask ? {
          ...data.context.currentTask,
          startedAt: data.context.currentTask.startedAt?.toDate?.() || new Date(data.context.currentTask.startedAt),
          completedAt: data.context.currentTask.completedAt?.toDate?.() || new Date(data.context.currentTask.completedAt),
          steps: (data.context.currentTask.steps || []).map((step: any) => ({
            ...step,
            startedAt: step.startedAt?.toDate?.() || (step.startedAt ? new Date(step.startedAt) : undefined),
            completedAt: step.completedAt?.toDate?.() || (step.completedAt ? new Date(step.completedAt) : undefined)
          }))
        } : null
      }
    };
  }

  /**
   * Clean up old conversation states (for maintenance)
   */
  async cleanupOldStates(olderThanDays: number = 30): Promise<number> {
    try {
      console.log(`🧹 FirebaseStateAdapter: Cleaning up states older than ${olderThanDays} days`);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      // Note: This would require a query in production
      // For now, we'll just log the intent
      console.log(`⚠️ FirebaseStateAdapter: Cleanup not fully implemented - requires Firestore queries`);
      
      return 0;
    } catch (error) {
      console.error(`❌ FirebaseStateAdapter: Error during cleanup:`, error);
      return 0;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{ totalStates: number; totalSize: number }> {
    try {
      console.log(`📊 FirebaseStateAdapter: Getting storage statistics`);
      
      // Note: This would require aggregation queries in production
      console.log(`⚠️ FirebaseStateAdapter: Storage stats not fully implemented`);
      
      return { totalStates: 0, totalSize: 0 };
    } catch (error) {
      console.error(`❌ FirebaseStateAdapter: Error getting storage stats:`, error);
      return { totalStates: 0, totalSize: 0 };
    }
  }
}

/**
 * Memory-based state adapter for development/testing
 */
export class MemoryStateAdapter implements StateStorageAdapter {
  private states: Map<string, ConversationState> = new Map();

  async loadState(sessionId: string): Promise<ConversationState | null> {
    console.log(`🔍 MemoryStateAdapter: Loading state for session ${sessionId}`);
    const state = this.states.get(sessionId) || null;
    
    if (state) {
      console.log(`✅ MemoryStateAdapter: State loaded from memory for session ${sessionId}`);
    } else {
      console.log(`📭 MemoryStateAdapter: No state found in memory for session ${sessionId}`);
    }
    
    return state;
  }

  async saveState(state: ConversationState): Promise<void> {
    console.log(`💾 MemoryStateAdapter: Saving state for session ${state.sessionId}`);
    
    // Deep clone to avoid reference issues
    const clonedState = JSON.parse(JSON.stringify(state, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }));
    
    // Convert date strings back to Date objects
    const restoredState = JSON.parse(JSON.stringify(clonedState), (key, value) => {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return new Date(value);
      }
      return value;
    });
    
    this.states.set(state.sessionId, restoredState);
    console.log(`✅ MemoryStateAdapter: State saved to memory for session ${state.sessionId}`);
  }

  async deleteState(sessionId: string): Promise<void> {
    console.log(`🗑️ MemoryStateAdapter: Deleting state for session ${sessionId}`);
    const deleted = this.states.delete(sessionId);
    
    if (deleted) {
      console.log(`✅ MemoryStateAdapter: State deleted from memory for session ${sessionId}`);
    } else {
      console.log(`⚠️ MemoryStateAdapter: No state found to delete for session ${sessionId}`);
    }
  }

  /**
   * Get all states (for debugging)
   */
  getAllStates(): Map<string, ConversationState> {
    return new Map(this.states);
  }

  /**
   * Clear all states (for testing)
   */
  clearAllStates(): void {
    console.log(`🧹 MemoryStateAdapter: Clearing all states`);
    this.states.clear();
  }

  /**
   * Get memory usage statistics
   */
  getStats(): { stateCount: number; memoryUsage: string } {
    const stateCount = this.states.size;
    const memoryUsage = `${JSON.stringify(Array.from(this.states.values())).length} characters`;
    
    return { stateCount, memoryUsage };
  }
}
