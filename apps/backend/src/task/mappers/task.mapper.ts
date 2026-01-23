import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { Task } from '../models/task.model';
import type { TaskEntity } from '../schemas/task.schema';

@Mapper({ model: Task })
export class TaskMapper extends BaseMapper<Task, TaskEntity> {}
