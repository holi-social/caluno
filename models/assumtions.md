# Basic assumptions we hold about our clients and the domain

### Structure
* Organizations have very different and complex internal organizational structures
* We assume a flexible hierarchichal structure will be enough to handle this

### RequirementProfiles
* An Organization wants to share RequirementProfiles across mutliple OrgUnits
* We don't expect and Organization to have very many different RequirementProfiles
* RequirementProfiles are not sensitive in nature and can be shared with everyone who has the permission to see them
* A user should not need to fill out the same RequirementProfile again when they join another OrgUnit
* Re-Submitting the filled out RequirementProfile and thereby acknowledging that the new OrgUnit gets access to this information is wanted
* Filling out the same data for a RequirementProfile for a different Organization is ok

### Permissions
* Roles are defined within an Organization
* Permissions are granted on an OrgUnit level and cascade down the OrgUnit hierarchy automatically
