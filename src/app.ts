enum ProjectStatus {
    Actvie , Finished
}

// Project type
class Project {
    constructor(
        public id:string , 
        public title: string , 
        public description: string,
        public people: number,
        public status : ProjectStatus
    ) {}
}


// Project State Management
type Listener<T> = (items: T[] ) => void;

class State<T> {
    protected listeners: Listener<T>[] = [];

    addListener(listenerFn: Listener<T>) {
        this.listeners.push(listenerFn);
    }

}
class ProjectState extends State<Project>{
    private projects: Project[]  = [];
    private static instance: ProjectState

    private constructor() {
        super();
    }

    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance
    }

    addProject(title: string,
         description: string, 
         numOfPeople:number
        ) {
        const newProject = new Project(
        Math.random().toString(),
        title,
        description,
        numOfPeople,
        ProjectStatus.Actvie
    );
        this.projects.push(newProject);
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
}
// Global constant
const projectState = ProjectState.getInstance();

//Validation decorator
interface Validatable {
    value : string | number;
    required? : boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
}

function validate(ValidatableInput: Validatable) {
    let isValid = true;
    if (ValidatableInput.required) {
        isValid = isValid && ValidatableInput.value.toString().trim().length !== 0;
    }
    if (ValidatableInput.minLength != null && 
        typeof ValidatableInput.value === 'string'
    ) {
        isValid = isValid && ValidatableInput.value.length >= ValidatableInput.minLength;
    }
    if (ValidatableInput.maxLength != null && typeof ValidatableInput.value === 'string') {
        isValid = isValid && ValidatableInput.value.length <= ValidatableInput.maxLength;
    }
    if (ValidatableInput.min != null && typeof ValidatableInput.value === 'number') {
        isValid = isValid && ValidatableInput.value >= ValidatableInput.min;
    }
    if (ValidatableInput.max != null && typeof ValidatableInput.value === 'number') {
        isValid = isValid && ValidatableInput.value <= ValidatableInput.max;
    }


    return isValid;
}

//autobind decorator
function autobind(_target: any, _methodName: string,
     descriptor: PropertyDescriptor) {

    const originalMethod = descriptor.value;
    const adjDescriptor: PropertyDescriptor = {
        configurable: true,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    };
    return adjDescriptor
}


// Compoenent Base Clas
abstract class Compoenent<T extends HTMLElement ,U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    hostElement : T;
    element: U;

    constructor(templateId : string,
        hostElementId: string,
        insertAtStart: boolean,
        newElementId?: string,
        ) {
            this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
            this.hostElement = document.getElementById(hostElementId)! as T;
        const importedNode = document.importNode(
            this.templateElement.content,
            true
        );
        this.element = importedNode.firstElementChild as U;
        if (newElementId) {
            this.element.id = newElementId;
        }
        this.attach(insertAtStart);
    }
    private attach(insertAtBeginning: boolean) {
        this.hostElement.insertAdjacentElement(
            insertAtBeginning ? 'afterbegin' : 'beforeend',
            this.element
        );
    }

    abstract configure(): void;
    abstract renderContent(): void;
}


// ProjectList Class
class ProjectList extends Compoenent<HTMLDivElement,HTMLElement> {
    assignedProjects: Project[];
    
    constructor(private type: 'active' | 'finished') {
        super('project-list','app',false,`${type}-projects`);
        this.assignedProjects = [];

        this.configure();
        this.renderContent();
    }

    configure() {
        projectState.addListener((projects: Project[]) => {
            const relevantProjects = projects.filter(prj => {
                if (this.type === 'active') {
                    return prj.status === ProjectStatus.Actvie;
                }
                return prj.status === ProjectStatus.Finished
            });
            this.assignedProjects = relevantProjects;
            this.renderProjects();
        });
    };

    renderContent() {
        const listId = `${this.type}-projects-list`; 
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS';
    }

    private renderProjects() {
        const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
        for (const prjItem of this.assignedProjects) {
          const listItem = document.createElement('li');
          listItem.textContent = prjItem.title;
          listEl.appendChild(listItem)
        }
    }
}




// ProjectInput Class
class ProjectInput extends Compoenent<HTMLDivElement,HTMLFormElement> {
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor() {
        super('project-input','app', true,'user-input');
        this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
        this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;
        this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
        this.configure();
    }
    
    public configure() {
        this.element.addEventListener('submit',this.submitHandler.bind(this))
    }
    public renderContent(): void {}
    
    private gatherUserInput(): [string,string,number] | void {
        const enteredTitle = this.titleInputElement.value;
        const enteredDescription = this.descriptionInputElement.value;
        const enteredPeople = this.peopleInputElement.value;


        const titleValidatable : Validatable = {
            value: enteredTitle,
            required: true,
        };
        const descriptionValidatable : Validatable = {
            value: enteredDescription,
            required: true,
            minLength: 5
        };
        const peopleValidatable : Validatable = {
            value: +enteredPeople,
            required: true,
            min: 1,
            max: 5
        };

        if (
            !validate(titleValidatable) ||
            !validate(descriptionValidatable) ||
            !validate(peopleValidatable)     
        ) {
                alert('Invalid input, please try again')
        } else {
            return [enteredTitle,enteredDescription,+enteredPeople];
        }
    }

    private clearInputs() {
        this.titleInputElement.value = '';
        this.descriptionInputElement.value = '';
        this.peopleInputElement.value = '';
    }


    @autobind
    private submitHandler(event : Event) : void{
        event.preventDefault();
        console.log(this.titleInputElement.value)
        const userInput = this.gatherUserInput();
        if (Array.isArray(userInput)) {
            const [title, desc,people] = userInput;
            projectState.addProject(title,desc,people);
            console.log(title,desc,people);
            this.clearInputs();


        }
    }


}

const prjInput = new ProjectInput();
const activePrjList = new ProjectList('active');
const finishedPrjList = new ProjectList('finished');