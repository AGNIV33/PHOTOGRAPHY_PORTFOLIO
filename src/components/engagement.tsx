"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { addComment, toggleLike } from "@/app/actions";

type Comment = { id: string; author_name: string; body: string; created_at: string };

export function LikeButton({ photoId, likes, liked, signedIn }: { photoId: string; likes: number; liked: boolean; signedIn: boolean }) {
  const router = useRouter();
  const [state, setState] = useOptimistic({ likes, liked });
  const [, start] = useTransition();

  if (!signedIn) {
    return (
      <Link href={`/signin?next=/photo/${photoId}`} className="like" aria-label="Sign in to like">
        <Heart filled={false} />
        <span>{likes}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="like"
      aria-pressed={state.liked}
      aria-label={state.liked ? "Unlike" : "Like"}
      onClick={() =>
        start(async () => {
          setState({ liked: !state.liked, likes: state.likes + (state.liked ? -1 : 1) });
          await toggleLike(photoId);
          router.refresh();
        })
      }
    >
      <Heart filled={state.liked} />
      <span>{state.likes}</span>
    </button>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20s-7-4.4-9.2-8.6C1.3 8.4 3 5 6.3 5c2 0 3.3 1.1 4 2.3h3.4C14.4 6.1 15.7 5 17.7 5 21 5 22.7 8.4 21.2 11.4 19 15.6 12 20 12 20z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function Comments({ photoId, comments, signedIn }: { photoId: string; comments: Comment[]; signedIn: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <section className="grid gap-6" aria-labelledby="comments-title">
      <h2 id="comments-title" className="kicker">
        {comments.length} comment{comments.length === 1 ? "" : "s"}
      </h2>
      {comments.length > 0 && (
        <ul className="grid">
          {comments.map((c) => (
            <li key={c.id} className="grid gap-1 border-b border-[var(--hairline)] py-4">
              <span className="text-[14px] font-semibold">
                {c.author_name}{" "}
                <span className="font-normal text-[var(--muted)]">
                  · {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </span>
              <p className="text-[var(--ink-2)] whitespace-pre-line">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
      {signedIn ? (
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              try {
                await addComment(photoId, body);
                setBody("");
                setError("");
                router.refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not post");
              }
            });
          }}
        >
          <label className="grid gap-1.5">
            <span className="label">Add a comment</span>
            <textarea className="field" rows={3} maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)} required />
          </label>
          <div className="flex items-center gap-4">
            <button type="submit" className="btn btn-primary" disabled={pending || !body.trim()}>
              {pending ? "Posting…" : "Post comment"}
            </button>
            {error && <span className="text-[var(--safelight)]">{error}</span>}
          </div>
        </form>
      ) : (
        <p className="text-[var(--ink-2)]">
          <Link href={`/signin?next=/photo/${photoId}`} className="underline text-[var(--ink)]">Sign in</Link> to like and comment.
        </p>
      )}
    </section>
  );
}
