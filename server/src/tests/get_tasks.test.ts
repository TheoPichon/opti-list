
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();

    expect(result).toEqual([]);
  });

  it('should return all tasks', async () => {
    // Create test tasks
    await db.insert(tasksTable)
      .values([
        { text: 'First task', completed: false },
        { text: 'Second task', completed: true },
        { text: 'Third task', completed: false }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    
    // Check that all tasks are returned with proper structure
    result.forEach(task => {
      expect(task.id).toBeDefined();
      expect(typeof task.text).toBe('string');
      expect(typeof task.completed).toBe('boolean');
      expect(task.created_at).toBeInstanceOf(Date);
      expect(task.updated_at).toBeInstanceOf(Date);
    });

    // Check specific task content
    const taskTexts = result.map(task => task.text);
    expect(taskTexts).toContain('First task');
    expect(taskTexts).toContain('Second task');
    expect(taskTexts).toContain('Third task');
  });

  it('should return tasks ordered by creation date (newest first)', async () => {
    // Create tasks with slight delay to ensure different timestamps
    await db.insert(tasksTable)
      .values({ text: 'Oldest task', completed: false })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable)
      .values({ text: 'Middle task', completed: true })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable)
      .values({ text: 'Newest task', completed: false })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    
    // Check that tasks are ordered newest first
    expect(result[0].text).toEqual('Newest task');
    expect(result[1].text).toEqual('Middle task');
    expect(result[2].text).toEqual('Oldest task');

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should return tasks with both completed and incomplete status', async () => {
    // Create tasks with different completion states
    await db.insert(tasksTable)
      .values([
        { text: 'Completed task', completed: true },
        { text: 'Incomplete task', completed: false }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    
    const completedTask = result.find(task => task.completed === true);
    const incompleteTask = result.find(task => task.completed === false);

    expect(completedTask).toBeDefined();
    expect(completedTask?.text).toEqual('Completed task');
    
    expect(incompleteTask).toBeDefined();
    expect(incompleteTask?.text).toEqual('Incomplete task');
  });

  it('should handle tasks with various text content', async () => {
    const testTexts = [
      'Simple task',
      'Task with special characters: !@#$%^&*()',
      'Very long task description that contains multiple words and sentences to test text handling',
      'Task with numbers 123 and symbols',
      'Emoji task 🚀 with unicode'
    ];

    // Insert tasks with various text content
    for (const text of testTexts) {
      await db.insert(tasksTable)
        .values({ text, completed: false })
        .execute();
    }

    const result = await getTasks();

    expect(result).toHaveLength(testTexts.length);
    
    const resultTexts = result.map(task => task.text);
    testTexts.forEach(text => {
      expect(resultTexts).toContain(text);
    });
  });
});
