import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { Project } from '../models/project.model';
import type { ProjectEntity } from '../schemas/project.schema';

@Mapper({ model: Project })
export class ProjectMapper extends BaseMapper<Project, ProjectEntity> {}
