export interface IdPlusName {
    id: string;
    name: string;
};

export interface FilesPlusPlus {
    files: IdPlusName[];
    comments: string;
    name: string;
    date: number;
}

export interface Activity {
    id: string;
    title: string;
    description: string;
    subject: string;
    files: IdPlusName[];
    type: string;
    delivery: string;
    author: IdPlusName;
    date: number;
    expiration: number;
    delivered: FilesPlusPlus;
    result: string;
    viewed: boolean;
    receiver: string[];
};

export interface Child {
    id: string;
    name: string;
};

export interface Person {
    id: string;
    name: string;
    type: string;
    subject: string;
    child: Child;
};

export interface PersonSelect {
    ID: string;
    Name: string;
    Type: string;
    Subject: string;
    Child: string;
};

export interface Grade {
    id: string;
    fullName: string;
    subject: string;
    deliberation: string;
    conceptual: string;
    averageFirstFour: string;
    averageSecondFour: string;
    final: string;
}

export interface User {
    id: string;
    name: string;
    teacher: string;
    administrator: boolean;
    grades: Grade[];
    avaliable: SimpleUser[];
    child: string
};

export interface SimpleUser {
    id: string;
    name: string;
    teacher: string;
    child: string;
    type: string;
};

export interface School {
    id: string;
    name: string;
};

export interface Message {
    id: string;
    title: string;
    content: string;
    pdf?: string;
    files: IdPlusName[];
    author: IdPlusName;
    date: number;
    receiver: IdPlusName[];
};

export interface Report {
    id: string;
    title: string;
    file: IdPlusName;
    author: IdPlusName;
    date: number;
};

export interface Result {
    result: string;
    name: string;
};

export interface Viewed {
    viewed: boolean;
    name: string;
};
