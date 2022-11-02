/// <reference path="models/drag_drop_interface.ts" />
/// <reference path="models/project_model.ts" />
/// <reference path="states/project_state.ts" />
/// <reference path="utils/validation.ts" />
/// <reference path="decorators/autobind_decorator.ts" />
/// <reference path="components/project-item.ts" />
/// <reference path="components/project-list.ts" />
/// <reference path="components/project-input.ts" />
namespace App {
    
    new ProjectInput();
    new ProjectList('active');
    new ProjectList('finished');

}