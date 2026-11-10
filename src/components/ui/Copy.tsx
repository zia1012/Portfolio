import { showTodos, splitTodo } from "@/lib/content";

/**
 * Renders a content string. Any "TODO…" part is outlined in development and
 * left out in production, so placeholders never ship.
 */
export function Copy({ text }: { text: string }) {
  const { text: main, todo } = splitTodo(text);
  return (
    <>
      {main}
      {todo && showTodos ? (
        <>
          {main ? " " : null}
          <span className="todo">{todo}</span>
        </>
      ) : null}
    </>
  );
}
