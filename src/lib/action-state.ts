/** Shape returned by server actions to forms rendered with useFormState. */
export interface ActionState {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export const initialActionState: ActionState = {};
