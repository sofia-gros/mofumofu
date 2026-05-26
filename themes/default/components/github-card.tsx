/**
 * GitHubのプロフィールカードを表示します。
 * ユーザーのアバター、名前、そして任意の説明文を表示します。
 */
interface GithubCardProps {
  user: string; // GitHubのユーザー名
  children?: any; // カードの下部に表示する追加の説明
}

export default function GithubCard({ user, children }: GithubCardProps) {
  return (
    <div style={{
      border: "1px solid #e2e8f0",
      borderRadius: "0.5rem",
      padding: "1rem",
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      margin: "1rem 0",
      background: "white"
    }}>
      <img 
        src={`https://github.com/${user}.png`} 
        alt={user} 
        style={{ width: "48px", height: "48px", borderRadius: "50%" }}
      />
      <div>
        <div style={{ fontWeight: "bold" }}>@{user}</div>
        <div style={{ fontSize: "0.875rem", color: "#64748b" }}>
          {children || "GitHub Profile"}
        </div>
      </div>
      <a 
        href={`https://github.com/${user}`} 
        target="_blank" 
        style={{ marginLeft: "auto", color: "#f26", textDecoration: "none", fontWeight: "600" }}
      >
        Follow
      </a>
    </div>
  );
}
