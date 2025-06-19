
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // Create a test task first
    const insertResult = await db.insert(tasksTable)
      .values({
        text: 'Task to delete',
        completed: false
      })
      .returning()
      .execute();

    const taskId = insertResult[0].id;

    // Delete the task
    const deleteInput: DeleteTaskInput = { id: taskId };
    await deleteTask(deleteInput);

    // Verify task was deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should not throw error when deleting non-existent task', async () => {
    const deleteInput: DeleteTaskInput = { id: 999 };
    
    // Should not throw error even if task doesn't exist
    await expect(deleteTask(deleteInput)).resolves.toBeUndefined();
  });

  it('should only delete the specified task', async () => {
    // Create multiple test tasks
    const insertResults = await db.insert(tasksTable)
      .values([
        { text: 'Task 1', completed: false },
        { text: 'Task 2', completed: true },
        { text: 'Task 3', completed: false }
      ])
      .returning()
      .execute();

    const taskToDelete = insertResults[1];

    // Delete the middle task
    const deleteInput: DeleteTaskInput = { id: taskToDelete.id };
    await deleteTask(deleteInput);

    // Verify only the specified task was deleted
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(remainingTasks).toHaveLength(2);
    expect(remainingTasks.map(t => t.text)).toEqual(['Task 1', 'Task 3']);
    expect(remainingTasks.find(t => t.id === taskToDelete.id)).toBeUndefined();
  });
});
