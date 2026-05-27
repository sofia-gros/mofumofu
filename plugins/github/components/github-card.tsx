/**
 * GitHubのユーザー情報をカード形式で表示します。
 */
interface GithubCardProps {
  user: string;
  children?: any;
}

export default function GithubCard({ user, children }: GithubCardProps) {
  return (
    <div class="el-card is-always-shadow" style="margin: 1rem 0; max-width: 400px;">
      <div class="el-card__body" style="display: flex; align-items: center; gap: 1rem;">
        <img 
          src={`https://github.com/${user}.png`} 
          alt={user} 
          style="width: 48px; height: 48px; border-radius: 50%;" 
        />
        <div style="flex-grow: 1;">
          <div style="font-weight: bold; font-size: 1.1rem;">@{user}</div>
          <div style="font-size: 0.875rem; color: #606266;">
            {children || "GitHub user"}
          </div>
        </div>
        <a 
          href={`https://github.com/${user}`} 
          target="_blank" 
          class="el-button el-button--primary el-button--small is-plain"
          style="text-decoration: none;"
        >
          Follow
        </a>
      </div>
    </div>
  );
}
