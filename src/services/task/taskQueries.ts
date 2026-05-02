import { mockTasks } from '@/mocks/tasks'
import type { Task } from '@/types/task'

const clone = <T,>(value: T): T => structuredClone(value)

export const getTaskList = (): Task[] => clone(mockTasks)
