
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task completion status', async () => {
    // Create a task first
    const insertResult = await db.insert(tasksTable)
      .values({
        text: 'Test task',
        completed: false
      })
      .returning()
      .execute();

    const taskId = insertResult[0].id;

    // Update the task
    const updateInput: UpdateTaskInput = {
      id: taskId,
      completed: true
    };

    const result = await updateTask(updateInput);

    // Verify the updated task
    expect(result.id).toEqual(taskId);
    expect(result.text).toEqual('Test task');
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated task to database', async () => {
    // Create a task first
    const insertResult = await db.insert(tasksTable)
      .values({
        text: 'Another test task',
        completed: false
      })
      .returning()
      .execute();

    const taskId = insertResult[0].id;
    const originalUpdatedAt = insertResult[0].updated_at;

    // Update the task
    const updateInput: UpdateTaskInput = {
      id: taskId,
      completed: true
    };

    await updateTask(updateInput);

    // Query the database to verify the update
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].completed).toEqual(true);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at > originalUpdatedAt).toBe(true);
  });

  it('should handle marking completed task as incomplete', async () => {
    // Create a completed task first
    const insertResult = await db.insert(tasksTable)
      .values({
        text: 'Completed task',
        completed: true
      })
      .returning()
      .execute();

    const taskId = insertResult[0].id;

    // Update to incomplete
    const updateInput: UpdateTaskInput = {
      id: taskId,
      completed: false
    };

    const result = await updateTask(updateInput);

    expect(result.completed).toEqual(false);
    expect(result.text).toEqual('Completed task');
  });

  it('should throw error when task does not exist', async () => {
    const updateInput: UpdateTaskInput = {
      id: 999,
      completed: true
    };

    expect(updateTask(updateInput)).rejects.toThrow(/not found/i);
  });
});
