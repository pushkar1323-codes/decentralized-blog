"use client";

import { useState, useCallback, useEffect, useRef, useMemo, memo } from "react";
import {
  createPost,
  getPost,
  addComment,
  getComments,
  getAllPosts,
  CONTRACT_ADDRESS,
  Post,
  Comment,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toFriendlyError } from "@/lib/errorMessages";
import { track, AnalyticsEvent } from "@/lib/analytics";
import * as Sentry from "@sentry/nextjs";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  id,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-[11px] font-medium uppercase tracking-wider text-white/50">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <input
          id={inputId}
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/55 outline-none"
        />
      </div>
    </div>
  );
}

function Textarea({
  label,
  id,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-[11px] font-medium uppercase tracking-wider text-white/50">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <textarea
          id={inputId}
          {...props}
          rows={4}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/55 outline-none resize-none"
        />
      </div>
    </div>
  );
}

// ── Shared helpers ───────────────────────────────────────────
// Pure functions with no dependency on component state/props, so they're
// defined once at module scope instead of being recreated on every render
// of every PostCard/CommentItem (previously duplicated 3x across the file).

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(timestamp: string) {
  const ts = Number(timestamp);
  const now = Math.floor(Date.now() / 1000);
  const diff = now - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Post Card ─────────────────────────────────────────────────

const PostCard = memo(function PostCard({
  post,
  onSelect,
  isSelected
}: {
  post: Post;
  onSelect: (id: number) => void;
  isSelected: boolean;
}) {
  return (
    <button
      onClick={() => onSelect(Number(post.id))}
      aria-current={isSelected}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.995]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c6cf0]/40",
        isSelected
          ? "border-[#7c6cf0]/30 bg-[#7c6cf0]/[0.05] shadow-[0_4px_20px_rgba(124,108,240,0.06)]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.03] hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-white/90 truncate">{String(post.title)}</h4>
          <p className="text-sm text-white/55 mt-1 line-clamp-2 leading-relaxed">{String(post.content)}</p>
        </div>
        <Badge variant="info" className="shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4fc3f7]" />
          #{String(post.id)}
        </Badge>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-white/45">
        <span className="flex items-center gap-1.5">
          <UserIcon />
          {truncateAddress(String(post.author))}
        </span>
        <span className="flex items-center gap-1.5">
          <ClockIcon />
          {timeAgo(String(post.timestamp))}
        </span>
        <span className="flex items-center gap-1.5">
          <MessageIcon />
          {Number(post.comment_count)}
        </span>
      </div>
    </button>
  );
});

// ── Comment Item ─────────────────────────────────────────────

const CommentItem = memo(function CommentItem({ comment }: { comment: Comment }) {
  const author = String(comment.author);

  return (
    <div className="flex gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] transition-colors hover:bg-white/[0.03] animate-fade-in-up">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4fc3f7]/30 to-[#7c6cf0]/30 text-[9px] font-bold text-white/70 font-mono">
        {author.slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-white/50">{truncateAddress(author)}</span>
          <span className="text-xs text-white/45">{timeAgo(String(comment.timestamp))}</span>
        </div>
        <p className="text-sm text-white/70 leading-relaxed break-words">{String(comment.content)}</p>
      </div>
    </div>
  );
});

// ── Skeleton loaders ─────────────────────────────────────────

function PostCardSkeleton() {
  return (
    <div className="w-full p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-white/[0.06]" />
          <div className="h-3 w-full rounded bg-white/[0.04]" />
        </div>
        <div className="h-5 w-10 shrink-0 rounded-full bg-white/[0.06]" />
      </div>
      <div className="flex items-center gap-4 mt-3">
        <div className="h-3 w-16 rounded bg-white/[0.04]" />
        <div className="h-3 w-10 rounded bg-white/[0.04]" />
        <div className="h-3 w-6 rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

type Tab = "feed" | "write" | "view";

const TX_SUCCESS_MESSAGES = new Set([
  "Post published on-chain!",
  "Comment added!",
]);

const TABS: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "feed", label: "Feed", icon: <MessageIcon />, color: "#4fc3f7" },
  { key: "write", label: "Write", icon: <PenIcon />, color: "#7c6cf0" },
  { key: "view", label: "View", icon: <RefreshIcon />, color: "#fbbf24" },
];

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
  connectPhase?: "checking" | "requesting-access" | "finalizing" | null;
}

interface UIError {
  title: string;
  message: string;
  retry?: () => void;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting, connectPhase }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("feed");
  const [error, setError] = useState<UIError | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const connectingLabel =
    connectPhase === "checking"
      ? "Checking Freighter..."
      : connectPhase === "requesting-access"
        ? "Approve in wallet..."
        : "Connecting...";

  // Write post state
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // View post state
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postNotFound, setPostNotFound] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  // Comments have their own inline error slot, separate from the global
  // toast, so a failed comment fetch doesn't hide a post that loaded fine.
  const [commentsError, setCommentsError] = useState<UIError | null>(null);

  // Feed state
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Stable refs to the latest version of each retryable action. Retry
  // callbacks read through these instead of closing over the function
  // being defined (which would be a self-reference-before-declaration).
  const loadPostsRef = useRef<() => void>(() => {});
  const loadPostRef = useRef<(postId: number) => void>(() => {});
  const loadCommentsRef = useRef<(postId: number) => void>(() => {});
  const handleCreatePostRef = useRef<() => void>(() => {});
  const handleAddCommentRef = useRef<() => void>(() => {});

  const loadPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const result = await getAllPosts();
      if (Array.isArray(result)) {
        setPosts(result as unknown as Post[]);
      }
    } catch (err) {
      console.error("Failed to load posts:", err);
      Sentry.captureException(err, { tags: { flow: "load_posts" } });
      const friendly = toFriendlyError(err, "We couldn't load the feed right now.");
      setError({
        title: friendly.title,
        message: friendly.message,
        retry: friendly.retryable ? () => loadPostsRef.current() : undefined,
      });
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  // Loads just the post itself. A missing post (contract returned nothing)
  // is not an error — it's handled as its own "not found" state so the UI
  // can say "this post doesn't exist" instead of a generic failure.
  const loadPost = useCallback(async (postId: number) => {
    setIsLoadingPost(true);
    setPostNotFound(false);
    try {
      const postResult = await getPost(postId);
      if (postResult && typeof postResult === "object") {
        setSelectedPost(postResult as unknown as Post);
      } else {
        setSelectedPost(null);
        setPostNotFound(true);
      }
    } catch (err) {
      console.error("Failed to load post:", err);
      Sentry.captureException(err, { tags: { flow: "load_post" }, extra: { postId } });
      setSelectedPost(null);
      const friendly = toFriendlyError(err, "We couldn't load this post right now.");
      setError({
        title: friendly.title,
        message: friendly.message,
        retry: friendly.retryable ? () => loadPostRef.current(postId) : undefined,
      });
    } finally {
      setIsLoadingPost(false);
    }
  }, []);

  // Loads just the comments for a post. Kept independent of loadPost so a
  // comments-fetch hiccup shows a small inline retry instead of wiping out
  // a post that already loaded successfully.
  const loadComments = useCallback(async (postId: number) => {
    setIsLoadingComments(true);
    setCommentsError(null);
    try {
      const commentsResult = await getComments(postId);
      setComments(Array.isArray(commentsResult) ? (commentsResult as unknown as Comment[]) : []);
    } catch (err) {
      console.error("Failed to load comments:", err);
      Sentry.captureException(err, { tags: { flow: "load_comments" }, extra: { postId } });
      const friendly = toFriendlyError(err, "We couldn't load comments right now.");
      setComments([]);
      setCommentsError({
        title: friendly.title,
        message: friendly.message,
        retry: friendly.retryable ? () => loadCommentsRef.current(postId) : undefined,
      });
    } finally {
      setIsLoadingComments(false);
    }
  }, []);

  // Auto-dismiss error toasts after a while so stale errors don't linger forever
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (selectedPostId !== null) {
      loadPost(selectedPostId);
      loadComments(selectedPostId);
    }
  }, [selectedPostId, loadPost, loadComments]);

  const handleCreatePost = useCallback(async () => {
    if (!walletAddress) {
      return setError({
        title: "Wallet required",
        message: "Connect your wallet to publish a post.",
      });
    }
    if (!postTitle.trim() && !postContent.trim()) {
      return setError({
        title: "Nothing to publish",
        message: "Please add a title and some content before publishing.",
      });
    }
    if (!postTitle.trim()) {
      return setError({ title: "Title required", message: "Please add a title for your post." });
    }
    if (!postContent.trim()) {
      return setError({
        title: "Content required",
        message: "Please write some content before publishing.",
      });
    }
    setError(null);
    setIsPosting(true);
    setTxStatus("Preparing transaction...");
    try {
      await createPost(walletAddress, postTitle.trim(), postContent.trim(), (phase) => {
        if (phase === "preparing") setTxStatus("Preparing transaction...");
        if (phase === "signing") setTxStatus("Waiting for wallet signature...");
        if (phase === "confirming") setTxStatus("Confirming on-chain...");
      });
      setTxStatus("Post published on-chain!");
      track(AnalyticsEvent.BLOG_PUBLISHED, {
        wallet_address: walletAddress,
        title_length: postTitle.trim().length,
        content_length: postContent.trim().length,
      });
      setPostTitle("");
      setPostContent("");
      setTimeout(() => setTxStatus(null), 5000);
      loadPosts();
      setActiveTab("feed");
    } catch (err: unknown) {
      console.error("Failed to create post:", err);
      Sentry.captureException(err, { tags: { flow: "create_post", type: "blockchain_transaction" } });
      const friendly = toFriendlyError(err, "We couldn't publish your post. Please try again.");
      setError({
        title: friendly.title,
        message: friendly.message,
        retry: friendly.retryable ? () => handleCreatePostRef.current() : undefined,
      });
      setTxStatus(null);
    } finally {
      setIsPosting(false);
    }
  }, [walletAddress, postTitle, postContent, loadPosts]);

  const handleAddComment = useCallback(async () => {
    if (!walletAddress) {
      return setError({
        title: "Wallet required",
        message: "Connect your wallet to leave a comment.",
      });
    }
    if (!commentContent.trim()) {
      return setError({
        title: "Empty comment",
        message: "Please write something before posting your comment.",
      });
    }
    if (selectedPostId === null) return;
    setError(null);
    setIsPostingComment(true);
    setTxStatus("Preparing transaction...");
    try {
      await addComment(selectedPostId, walletAddress, commentContent.trim(), (phase) => {
        if (phase === "preparing") setTxStatus("Preparing transaction...");
        if (phase === "signing") setTxStatus("Waiting for wallet signature...");
        if (phase === "confirming") setTxStatus("Confirming on-chain...");
      });
      setTxStatus("Comment added!");
      track(AnalyticsEvent.COMMENT_ADDED, {
        wallet_address: walletAddress,
        post_id: selectedPostId,
        content_length: commentContent.trim().length,
      });
      setCommentContent("");
      loadComments(selectedPostId);
      loadPosts();
      setTimeout(() => setTxStatus(null), 3000);
    } catch (err: unknown) {
      console.error("Failed to add comment:", err);
      Sentry.captureException(err, { tags: { flow: "add_comment", type: "blockchain_transaction" } });
      const friendly = toFriendlyError(err, "We couldn't post your comment. Please try again.");
      setError({
        title: friendly.title,
        message: friendly.message,
        retry: friendly.retryable ? () => handleAddCommentRef.current() : undefined,
      });
      setTxStatus(null);
    } finally {
      setIsPostingComment(false);
    }
  }, [walletAddress, commentContent, selectedPostId, loadComments, loadPosts]);

  // Keep the retry refs pointed at the latest versions of these callbacks.
  // Runs after render (not during), so it satisfies the rules-of-hooks
  // linter that flagged the previous render-time ref mutation.
  useEffect(() => {
    loadPostsRef.current = loadPosts;
    loadPostRef.current = loadPost;
    loadCommentsRef.current = loadComments;
    handleCreatePostRef.current = handleCreatePost;
    handleAddCommentRef.current = handleAddComment;
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadPosts();
      if (selectedPostId !== null) {
        await Promise.all([loadPost(selectedPostId), loadComments(selectedPostId)]);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [loadPosts, selectedPostId, loadPost, loadComments]);

  // Stable callback passed to every PostCard. Combined with the memoized
  // reversedPosts list below and React.memo on PostCard, this means
  // clicking a post (or any unrelated state change elsewhere in this
  // component, like typing in the Write tab) doesn't force every other
  // PostCard to re-render — only the newly- and previously-selected cards
  // actually receive new props.
  const handleSelectPost = useCallback(
    (id: number) => {
      setSelectedPostId(id);
      setActiveTab("view");
      track(AnalyticsEvent.BLOG_VIEWED, { post_id: id, wallet_address: walletAddress });
    },
    [walletAddress]
  );

  // Recomputed only when `posts` actually changes (new fetch), instead of
  // on every render of this component — e.g. previously, typing a single
  // character into the Write tab's title field would re-run
  // [...posts].reverse() and remap the whole array again for no reason.
  const reversedPosts = useMemo(() => [...posts].reverse(), [posts]);

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">{error.title}</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-words">{error.message}</p>
            {error.retry && (
              <button
                onClick={() => { const retry = error.retry; setError(null); retry?.(); }}
                className="mt-2 text-xs font-medium text-[#f87171]/70 hover:text-[#f87171] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f87171]/40 rounded"
              >
                Retry
              </button>
            )}
          </div>
          <button
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="shrink-0 rounded p-0.5 text-[#f87171]/30 hover:text-[#f87171]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f87171]/40 text-lg leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {txStatus && (
        <div role="status" className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {TX_SUCCESS_MESSAGES.has(txStatus) ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 sm:px-6 py-4 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#4fc3f7]/20 border border-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7c6cf0]">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" />
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                  <path d="M2 2l7.586 7.586" />
                  <circle cx="11" cy="11" r="2" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white/90">Decentralized Blog</h3>
                <p className="text-[10px] text-white/45 font-mono mt-0.5 truncate">{truncateAddress(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh posts"
              className="shrink-0 p-2 rounded-lg text-white/50 hover:text-white/60 hover:bg-white/[0.03] transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c6cf0]/40"
            >
              <span className={cn("block", isRefreshing && "animate-spin")}>
                <RefreshIcon />
              </span>
            </button>
          </div>

          {/* Tabs */}
          <div role="tablist" aria-label="Blog sections" className="flex border-b border-white/[0.06] px-1 sm:px-2 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={activeTab === t.key}
                onClick={() => { setActiveTab(t.key); setError(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-3.5 sm:px-5 py-3.5 text-sm font-medium transition-colors whitespace-nowrap",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7c6cf0]/40",
                  activeTab === t.key ? "text-white/90" : "text-white/50 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                <span
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all duration-300 origin-center"
                  style={{
                    background: `linear-gradient(to right, ${t.color}, ${t.color}66)`,
                    opacity: activeTab === t.key ? 1 : 0,
                    transform: activeTab === t.key ? "scaleX(1)" : "scaleX(0.5)",
                  }}
                />
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {/* Feed */}
            {activeTab === "feed" && (
              <div className="space-y-4">
                <p className="text-xs text-white/50 font-medium uppercase tracking-wider">Latest Posts</p>
                {isLoadingPosts ? (
                  <div className="space-y-3" aria-busy="true" aria-label="Loading posts">
                    <PostCardSkeleton />
                    <PostCardSkeleton />
                    <PostCardSkeleton />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.06] text-white/45">
                      <PenIcon />
                    </div>
                    <p className="text-white/55 text-sm">No posts yet</p>
                    <p className="text-white/45 text-xs mt-1">Be the first to write something!</p>
                    <button
                      onClick={() => setActiveTab("write")}
                      className="mt-4 text-xs font-medium text-[#7c6cf0]/70 hover:text-[#7c6cf0] transition-colors focus-visible:outline-none focus-visible:underline"
                    >
                      Write the first post →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reversedPosts.map((post, i) => (
                      <div
                        key={String(post.id)}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${Math.min(i, 8) * 40}ms`, animationFillMode: "both" }}
                      >
                        <PostCard
                          post={post}
                          isSelected={selectedPostId === Number(post.id)}
                          onSelect={handleSelectPost}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Write */}
            {activeTab === "write" && (
              <div className="space-y-5">
                <p className="text-xs text-white/50 font-medium uppercase tracking-wider">Create New Post</p>
                <Input
                  label="Title"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="Your post title..."
                  maxLength={100}
                />
                <p className="text-xs text-white/45 text-right -mt-3">{postTitle.length}/100</p>
                <Textarea
                  label="Content"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Write your thoughts..."
                  maxLength={2000}
                />
                <p className="text-xs text-white/45 text-right">{postContent.length}/2000</p>
                {walletAddress ? (
                  <ShimmerButton
                    onClick={handleCreatePost}
                    disabled={isPosting || !postTitle.trim() || !postContent.trim()}
                    shimmerColor="#7c6cf0"
                    className="w-full"
                  >
                    {isPosting ? <><SpinnerIcon /> {txStatus ?? "Publishing..."}</> : <><PenIcon /> Publish Post</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#7c6cf0]/20 bg-[#7c6cf0]/[0.03] py-4 text-sm text-[#7c6cf0]/60 hover:border-[#7c6cf0]/30 hover:text-[#7c6cf0]/80 active:scale-[0.99] transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c6cf0]/40"
                  >
                    {isConnecting ? <><SpinnerIcon /> {connectingLabel}</> : "Connect wallet to publish"}
                  </button>
                )}
              </div>
            )}

            {/* View */}
            {activeTab === "view" && (
              <div className="space-y-5">
                {selectedPostId === null ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.06] text-white/45">
                      <MessageIcon />
                    </div>
                    <p className="text-white/55 text-sm">Select a post to view</p>
                    <button
                      onClick={() => setActiveTab("feed")}
                      className="mt-2 text-xs text-[#4fc3f7]/60 hover:text-[#4fc3f7] transition-colors focus-visible:outline-none focus-visible:underline"
                    >
                      Browse posts
                    </button>
                  </div>
                ) : isLoadingPost ? (
                  <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading post">
                    <div className="h-5 w-2/3 rounded bg-white/[0.06]" />
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-white/[0.04]" />
                      <div className="h-3 w-full rounded bg-white/[0.04]" />
                      <div className="h-3 w-4/5 rounded bg-white/[0.04]" />
                    </div>
                  </div>
                ) : selectedPost ? (
                  <>
                    {/* Post Content */}
                    <div className="animate-fade-in-up">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <h2 className="text-lg sm:text-xl font-semibold text-white/90 break-words">{String(selectedPost.title)}</h2>
                        <Badge variant="info" className="shrink-0">
                          #{String(selectedPost.id)}
                        </Badge>
                      </div>
                      <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap break-words">{String(selectedPost.content)}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-white/[0.06] text-xs text-white/45">
                        <span className="flex items-center gap-1.5">
                          <UserIcon />
                          {truncateAddress(String(selectedPost.author))}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <ClockIcon />
                          {new Date(Number(selectedPost.timestamp) * 1000).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div className="border-t border-white/[0.06] pt-5">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-white/50 font-medium uppercase tracking-wider">
                          Comments ({comments.length})
                        </p>
                      </div>

                      {isLoadingComments ? (
                        <div className="space-y-2 mb-4" aria-busy="true" aria-label="Loading comments">
                          <div className="h-14 rounded-lg bg-white/[0.02] border border-white/[0.04] animate-pulse" />
                          <div className="h-14 rounded-lg bg-white/[0.02] border border-white/[0.04] animate-pulse" />
                        </div>
                      ) : commentsError ? (
                        <div className="mb-4 rounded-lg border border-[#f87171]/15 bg-[#f87171]/[0.04] px-3 py-3 text-center">
                          <p className="text-xs text-[#f87171]/80 font-medium">{commentsError.title}</p>
                          <p className="text-xs text-[#f87171]/50 mt-0.5">{commentsError.message}</p>
                          {commentsError.retry && (
                            <button
                              onClick={() => commentsError.retry?.()}
                              className="mt-2 text-xs font-medium text-[#f87171]/70 hover:text-[#f87171] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f87171]/40 rounded"
                            >
                              Retry
                            </button>
                          )}
                        </div>
                      ) : comments.length === 0 ? (
                        <p className="text-xs text-white/50 text-center py-4">No comments yet. Be the first!</p>
                      ) : (
                        <div className="space-y-2 mb-4">
                          {comments.map((comment) => (
                            <CommentItem key={String(comment.id)} comment={comment} />
                          ))}
                        </div>
                      )}

                      {/* Add Comment */}
                      {walletAddress ? (
                        <div className="space-y-2">
                          <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#4fc3f7]/30 focus-within:shadow-[0_0_20px_rgba(79,195,247,0.08)]">
                            <label htmlFor="comment-content" className="sr-only">Comment</label>
                            <textarea
                              id="comment-content"
                              value={commentContent}
                              onChange={(e) => setCommentContent(e.target.value)}
                              placeholder="Write a comment..."
                              rows={2}
                              className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/55 outline-none resize-none"
                              maxLength={500}
                            />
                          </div>
                          <p className="text-xs text-white/45 text-right">{commentContent.length}/500</p>
                          <ShimmerButton
                            onClick={handleAddComment}
                            disabled={isPostingComment || !commentContent.trim()}
                            shimmerColor="#4fc3f7"
                            className="w-full"
                          >
                            {isPostingComment ? (
                              <><SpinnerIcon /> {txStatus ?? "Posting..."}</>
                            ) : (
                              <><MessageIcon /> Add Comment</>
                            )}
                          </ShimmerButton>
                        </div>
                      ) : (
                        <button
                          onClick={onConnect}
                          disabled={isConnecting}
                          className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#4fc3f7]/20 bg-[#4fc3f7]/[0.03] py-3 text-sm text-[#4fc3f7]/60 hover:border-[#4fc3f7]/30 hover:text-[#4fc3f7]/80 active:scale-[0.99] transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4fc3f7]/40"
                        >
                          {isConnecting ? <><SpinnerIcon /> {connectingLabel}</> : "Connect wallet to comment"}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.06] text-white/45">
                      <AlertIcon />
                    </div>
                    <p className="text-white/55 text-sm">
                      {postNotFound ? "This post doesn't exist or may have been removed." : "Couldn't load this post."}
                    </p>
                    <button
                      onClick={() => setActiveTab("feed")}
                      className="mt-2 text-xs text-[#4fc3f7]/60 hover:text-[#4fc3f7] transition-colors focus-visible:outline-none focus-visible:underline"
                    >
                      Back to feed
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p className="text-[10px] text-white/55">Decentralized Blog &middot; Soroban</p>
            <p className="text-[10px] text-white/55">Permissionless &middot; On-chain</p>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}
