import React, { useState, useEffect } from "react";
import { useAuthenticatedUser, useAccount, useCreatePost } from "@lens-protocol/react";
import { LoginForm } from "./LoginForm";
import { LogoutButton } from "./LogoutButton";
import { textOnly } from '@lens-protocol/metadata';
import { handleOperationWith } from "@lens-protocol/react/viem";
import { useWalletClient } from "wagmi";
import { fetchPostsForYou } from "@lens-protocol/client/actions";
import { evmAddress } from "@lens-protocol/client";
import { client } from "./client";
export function App() {
  const { data: authUser } = useAuthenticatedUser({ suspense: true });
  const { data: walletClient } = useWalletClient();
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [errorPosts, setErrorPosts] = useState<string | null>(null);
  const account = useAccount({
    address: authUser?.address ?? "",
    suspense: true,
  });

  const { execute, loading, data: postData } = useCreatePost(
    handleOperationWith(walletClient)
  );

  const [newPost, setNewPost] = useState("");
  const [userPosts, setUserPosts] = useState([]);

  const userDisplayName =
    account.data?.username?.value ??
    account.data?.metadata?.name ??
    (authUser?.address
      ? `${authUser.address.slice(0, 6)}...${authUser.address.slice(-4)}`
      : "Anonymous");

  // Fetch posts made by the connected user
  useEffect(() => {
    async function loadUserPosts() {
      if (!authUser?.address) return;

      setLoadingPosts(true);
      setErrorPosts(null);

      try {
        const result = await fetchPostsForYou(client, {
          account: evmAddress(authUser.address),
          shuffle: false,
        });

        if (result.isErr()) {
          setErrorPosts(result.error.message);
          console.error("Failed to fetch posts:", result.error);
          setUserPosts([]);
        } else {
          setUserPosts(result.value.items);
        }
      } catch (err) {
        setErrorPosts("Unexpected error fetching posts");
        console.error(err);
        setUserPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    }

    loadUserPosts();
  }, [authUser?.address]);


  const handleCreatePost = async () => {
    if (!newPost.trim()) return;

    const metadata = textOnly({ content: newPost.trim() });

    const result = await execute({
      contentUri: `data:application/json,${JSON.stringify(metadata)}`,
    });

    if (result.isErr()) {
      alert(`❌ Failed to post: ${result.error.message}`);
      return;
    }

    alert("✅ Post published on Lens!");
    console.log(result)
    setNewPost("");

    // Refresh posts after successful post creation
    if (authUser?.address) {
      const refreshed = await fetchPostsForYou(client, {
        account: evmAddress(authUser.address),
        shuffle: false,
      });
      if (!refreshed.isErr()) {
        setUserPosts(refreshed.value.items);
      }
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>
          {authUser ? `Welcome, ${userDisplayName}` : "📝 Lens Dark Forum"}
        </h1>
        {authUser ? (
          <LogoutButton className="bg-white text-indigo-600 font-semibold px-6 py-2 rounded shadow hover:bg-gray-100 transition" />
        ) : (
          <LoginForm className="bg-white text-indigo-600 font-semibold px-6 py-2 rounded shadow hover:bg-gray-100 transition" />
        )}
      </header>

      {!authUser && (
        <p style={styles.infoText}>Please log in with Lens to continue.</p>
      )}

      {authUser && (
        <>
          <section style={styles.postForm}>
            <textarea
              rows={4}
              placeholder="Write a new post..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              style={styles.textarea}
              maxLength={280}
            />
            <button
              onClick={handleCreatePost}
              style={{ ...styles.button, marginTop: 10 }}
              disabled={!newPost.trim() || loading}
            >
              {loading ? "Posting..." : "Post to Lens"}
            </button>
          </section>

          <section style={styles.postsSection}>
            <h2 style={styles.postsTitle}>Your Lens Posts</h2>
            {userPosts.length === 0 ? (
              <p style={styles.infoText}>No posts yet. Be the first!</p>
            ) : (
              <ul style={styles.postsList}>
                {userPosts.map((post) => (
                  <li key={post.id} style={styles.post}>
                    <div style={styles.postHeader}>
                      <strong style={styles.postAuthor}>{userDisplayName}</strong>
                      <time style={styles.postDate}>
                        {new Date(post.createdAt).toLocaleString()}
                      </time>
                    </div>
                    <p style={styles.postContent}>
                      {post.metadata.__typename === "TextOnlyMetadata" && post.metadata.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}


// Dark theme styles (unchanged)
const styles = {
  container: {
    maxWidth: 700,
    margin: "50px auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: 20,
    backgroundColor: "#121212",
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(0,0,0,0.7)",
    color: "#e0e0e0",
    minHeight: "90vh",
  },
  header: {
    marginBottom: 40,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#bb86fc",
  },
  infoText: {
    fontSize: 16,
    color: "#a1a1a1",
    textAlign: "center",
  },
  postForm: {
    backgroundColor: "#1f1f1f",
    padding: 24,
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.9)",
    marginBottom: 40,
  },
  textarea: {
    width: "100%",
    padding: 16,
    fontSize: 16,
    borderRadius: 8,
    border: "1px solid #333",
    resize: "vertical",
    outline: "none",
    minHeight: 100,
    backgroundColor: "#2c2c2c",
    color: "#e0e0e0",
    transition: "border-color 0.2s",
  },
  button: {
    marginTop: 16,
    padding: "12px 24px",
    fontSize: 16,
    borderRadius: 8,
    border: "none",
    backgroundColor: "#bb86fc",
    color: "#121212",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(187, 134, 252, 0.6)",
    transition: "background-color 0.3s",
    userSelect: "none",
  },
  postsSection: {},
  postsTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#bb86fc",
  },
  postsList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  post: {
    backgroundColor: "#2a2a2a",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.8)",
    marginBottom: 20,
    color: "#e0e0e0",
  },
  postHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  postAuthor: {
    color: "#bb86fc",
    fontWeight: "700",
  },
  postDate: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },
  postContent: {
    fontSize: 16,
    whiteSpace: "pre-wrap",
  },
};
