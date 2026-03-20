"use client";

import { useState, useCallback, useEffect } from "react";
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
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
        />
      </div>
    </div>
  );
}

function Textarea({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <textarea
          {...props}
          rows={4}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none resize-none"
        />
      </div>
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────

function PostCard({ 
  post, 
  onSelect,
  isSelected 
}: { 
  post: Post; 
  onSelect: () => void;
  isSelected: boolean;
}) {
  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const timeAgo = (timestamp: string) => {
    const ts = Number(timestamp);
    const now = Math.floor(Date.now() / 1000);
    const diff = now - ts;
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all",
        isSelected
          ? "border-[#7c6cf0]/30 bg-[#7c6cf0]/[0.05]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.03]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-white/90 truncate">{String(post.title)}</h4>
          <p className="text-sm text-white/40 mt-1 line-clamp-2">{String(post.content)}</p>
        </div>
        <Badge variant="info" className="shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4fc3f7]" />
          #{String(post.id)}
        </Badge>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-white/25">
        <span className="flex items-center gap-1.5">
          <UserIcon />
          {truncate(String(post.author))}
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
}

// ── Comment Item ─────────────────────────────────────────────

function CommentItem({ comment }: { comment: Comment }) {
  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const timeAgo = (timestamp: string) => {
    const ts = Number(timestamp);
    const now = Math.floor(Date.now() / 1000);
    const diff = now - ts;
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="flex gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-white/50">{truncate(String(comment.author))}</span>
          <span className="text-xs text-white/20">{timeAgo(String(comment.timestamp))}</span>
        </div>
        <p className="text-sm text-white/70">{String(comment.content)}</p>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

type Tab = "feed" | "write" | "view";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("feed");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Write post state
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // View post state
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [commentContent, setCommentContent] = useState("");

  // Feed state
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const result = await getAllPosts();
      if (Array.isArray(result)) {
        setPosts(result as unknown as Post[]);
      }
    } catch (err) {
      console.error("Failed to load posts:", err);
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  const loadPostAndComments = useCallback(async (postId: number) => {
    setIsLoadingPost(true);
    setIsLoadingComments(true);
    try {
      const postResult = await getPost(postId);
      if (postResult && typeof postResult === "object") {
        setSelectedPost(postResult as unknown as Post);
      }
      const commentsResult = await getComments(postId);
      if (Array.isArray(commentsResult)) {
        setComments(commentsResult as unknown as Comment[]);
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error("Failed to load post:", err);
      setError("Failed to load post");
    } finally {
      setIsLoadingPost(false);
      setIsLoadingComments(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (selectedPostId !== null) {
      loadPostAndComments(selectedPostId);
    }
  }, [selectedPostId, loadPostAndComments]);

  const handleCreatePost = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!postTitle.trim() || !postContent.trim()) return setError("Fill in all fields");
    setError(null);
    setIsPosting(true);
    setTxStatus("Awaiting signature...");
    try {
      await createPost(walletAddress, postTitle.trim(), postContent.trim());
      setTxStatus("Post published on-chain!");
      setPostTitle("");
      setPostContent("");
      setTimeout(() => setTxStatus(null), 5000);
      loadPosts();
      setActiveTab("feed");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsPosting(false);
    }
  }, [walletAddress, postTitle, postContent, loadPosts]);

  const handleAddComment = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!commentContent.trim()) return setError("Enter a comment");
    if (selectedPostId === null) return;
    setError(null);
    setIsPostingComment(true);
    setTxStatus("Awaiting signature...");
    try {
      await addComment(selectedPostId, walletAddress, commentContent.trim());
      setTxStatus("Comment added!");
      setCommentContent("");
      loadPostAndComments(selectedPostId);
      loadPosts();
      setTimeout(() => setTxStatus(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsPostingComment(false);
    }
  }, [walletAddress, commentContent, selectedPostId, loadPostAndComments, loadPosts]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadPosts();
    if (selectedPostId !== null) {
      await loadPostAndComments(selectedPostId);
    }
    setIsRefreshing(false);
  }, [loadPosts, selectedPostId, loadPostAndComments]);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "feed", label: "Feed", icon: <MessageIcon />, color: "#4fc3f7" },
    { key: "write", label: "Write", icon: <PenIcon />, color: "#7c6cf0" },
    { key: "view", label: "View", icon: <RefreshIcon />, color: "#fbbf24" },
  ];

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("on-chain") || txStatus.includes("added") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#4fc3f7]/20 border border-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7c6cf0]">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" />
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                  <path d="M2 2l7.586 7.586" />
                  <circle cx="11" cy="11" r="2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">Decentralized Blog</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-all disabled:opacity-50"
            >
              <RefreshIcon />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Feed */}
            {activeTab === "feed" && (
              <div className="space-y-4">
                <p className="text-xs text-white/30 font-medium uppercase tracking-wider">Latest Posts</p>
                {isLoadingPosts ? (
                  <div className="flex items-center justify-center py-12">
                    <SpinnerIcon />
                    <span className="ml-2 text-sm text-white/40">Loading posts...</span>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-white/40 text-sm">No posts yet</p>
                    <p className="text-white/20 text-xs mt-1">Be the first to write something!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...posts].reverse().map((post) => (
                      <PostCard
                        key={String(post.id)}
                        post={post}
                        isSelected={selectedPostId === Number(post.id)}
                        onSelect={() => {
                          setSelectedPostId(Number(post.id));
                          setActiveTab("view");
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Write */}
            {activeTab === "write" && (
              <div className="space-y-5">
                <p className="text-xs text-white/30 font-medium uppercase tracking-wider">Create New Post</p>
                <Input
                  label="Title"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="Your post title..."
                  maxLength={100}
                />
                <Textarea
                  label="Content"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Write your thoughts..."
                  maxLength={2000}
                />
                <p className="text-xs text-white/20 text-right">{postContent.length}/2000</p>
                {walletAddress ? (
                  <ShimmerButton onClick={handleCreatePost} disabled={isPosting} shimmerColor="#7c6cf0" className="w-full">
                    {isPosting ? <><SpinnerIcon /> Publishing...</> : <><PenIcon /> Publish Post</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#7c6cf0]/20 bg-[#7c6cf0]/[0.03] py-4 text-sm text-[#7c6cf0]/60 hover:border-[#7c6cf0]/30 hover:text-[#7c6cf0]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to publish
                  </button>
                )}
              </div>
            )}

            {/* View */}
            {activeTab === "view" && (
              <div className="space-y-5">
                {selectedPostId === null ? (
                  <div className="text-center py-12">
                    <p className="text-white/40 text-sm">Select a post to view</p>
                    <button
                      onClick={() => setActiveTab("feed")}
                      className="mt-2 text-xs text-[#4fc3f7]/60 hover:text-[#4fc3f7]"
                    >
                      Browse posts
                    </button>
                  </div>
                ) : isLoadingPost ? (
                  <div className="flex items-center justify-center py-12">
                    <SpinnerIcon />
                    <span className="ml-2 text-sm text-white/40">Loading post...</span>
                  </div>
                ) : selectedPost ? (
                  <>
                    {/* Post Content */}
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <h2 className="text-lg font-semibold text-white/90">{String(selectedPost.title)}</h2>
                        <Badge variant="info" className="shrink-0">
                          #{String(selectedPost.id)}
                        </Badge>
                      </div>
                      <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{String(selectedPost.content)}</p>
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.06] text-xs text-white/25">
                        <span className="flex items-center gap-1.5">
                          <UserIcon />
                          {truncate(String(selectedPost.author))}
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
                        <p className="text-xs text-white/30 font-medium uppercase tracking-wider">
                          Comments ({comments.length})
                        </p>
                      </div>

                      {isLoadingComments ? (
                        <div className="flex items-center justify-center py-6">
                          <SpinnerIcon />
                          <span className="ml-2 text-xs text-white/40">Loading comments...</span>
                        </div>
                      ) : comments.length === 0 ? (
                        <p className="text-xs text-white/30 text-center py-4">No comments yet. Be the first!</p>
                      ) : (
                        <div className="space-y-2 mb-4">
                          {comments.map((comment) => (
                            <CommentItem key={String(comment.id)} comment={comment} />
                          ))}
                        </div>
                      )}

                      {/* Add Comment */}
                      {walletAddress ? (
                        <div className="space-y-3">
                          <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#4fc3f7]/30 focus-within:shadow-[0_0_20px_rgba(79,195,247,0.08)]">
                            <textarea
                              value={commentContent}
                              onChange={(e) => setCommentContent(e.target.value)}
                              placeholder="Write a comment..."
                              rows={2}
                              className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none resize-none"
                              maxLength={500}
                            />
                          </div>
                          <ShimmerButton
                            onClick={handleAddComment}
                            disabled={isPostingComment || !commentContent.trim()}
                            shimmerColor="#4fc3f7"
                            className="w-full"
                          >
                            {isPostingComment ? (
                              <><SpinnerIcon /> Posting...</>
                            ) : (
                              <><MessageIcon /> Add Comment</>
                            )}
                          </ShimmerButton>
                        </div>
                      ) : (
                        <button
                          onClick={onConnect}
                          disabled={isConnecting}
                          className="w-full rounded-xl border border-dashed border-[#4fc3f7]/20 bg-[#4fc3f7]/[0.03] py-3 text-sm text-[#4fc3f7]/60 hover:border-[#4fc3f7]/30 hover:text-[#4fc3f7]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                        >
                          Connect wallet to comment
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-white/40 text-sm text-center">Post not found</p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">Decentralized Blog &middot; Soroban</p>
            <p className="text-[10px] text-white/15">Permissionless &middot; On-chain</p>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}
