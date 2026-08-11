export interface WorkflowNode{
    id: string;
    type : string;
    data : { label: string };
    position : { x: number, y: number };
}