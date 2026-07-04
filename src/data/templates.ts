export interface Template {
  name: string;
  description: string;
  code: string;
  category: 'Flowchart' | 'Sequence' | 'Class' | 'State' | 'ER' | 'Gantt' | 'Pie';
}

export const templates: Template[] = [
  {
    name: 'Simple Flowchart',
    description: 'A basic top-down flowchart with a decision point.',
    category: 'Flowchart',
    code: `graph TD
  A[Start] --> B(Process)
  B --> C{Decision}
  C -->|One| D[Result 1]
  C -->|Two| E[Result 2]`,
  },
  {
    name: 'Sequence Diagram',
    description: 'Interaction between Alice, Bob, and John.',
    category: 'Sequence',
    code: `sequenceDiagram
  Alice->>John: Hello John, how are you?
  loop Healthcheck
      John->>John: Fight against hypochondria
  end
  Note right of John: Rational thoughts <br/>prevail!
  John-->>Alice: Great!
  John->>Bob: How about you?
  Bob-->>John: Jolly good!`,
  },
  {
    name: 'Class Diagram',
    description: 'UML class diagram for a simple system.',
    category: 'Class',
    code: `classDiagram
  Animal <|-- Duck
  Animal <|-- Fish
  Animal <|-- Zebra
  Animal : +int age
  Animal : +String gender
  Animal: +isMammal()
  Animal: +mate()
  class Duck{
    +String beakColor
    +swim()
    +quack()
  }
  class Fish{
    -int sizeInFeet
    -canEat()
  }
  class Zebra{
    +bool is_wild
    +run()
  }`,
  },
  {
    name: 'State Diagram',
    description: 'A state machine diagram.',
    category: 'State',
    code: `stateDiagram-v2
  [*] --> Still
  Still --> [*]
  Still --> Moving
  Moving --> Still
  Moving --> Crash
  Crash --> [*]`,
  },
  {
    name: 'ER Diagram',
    description: 'Entity Relationship diagram for an order system.',
    category: 'ER',
    code: `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE-ITEM : contains
  CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`,
  },
  {
    name: 'Gantt Chart',
    description: 'Project timeline visualization.',
    category: 'Gantt',
    code: `gantt
  title A Gantt Diagram
  dateFormat  YYYY-MM-DD
  section Section
  A task           :a1, 2014-01-01, 30d
  Another task     :after a1  , 20d
  section Another
  Task in sec      :2014-01-12  , 12d
  another task      : 24d`,
  },
  {
    name: 'Pie Chart',
    description: 'Simple data distribution.',
    category: 'Pie',
    code: `pie title Pets adopted by volunteers
  "Dogs" : 386
  "Cats" : 85
  "Rats" : 15`,
  }
];
