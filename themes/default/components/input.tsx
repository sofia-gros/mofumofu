/**
 * テキスト入力フィールドを表示します。
 */
interface InputProps {
  placeholder?: string;
  type?: string;
  value?: string;
}

export default function Input({ placeholder = "入力してください", type = "text", value = "" }: InputProps) {
  return (
    <div class="el-input" style="margin: 1rem 0;">
      <div class="el-input__wrapper">
        <input 
          class="el-input__inner" 
          type={type} 
          placeholder={placeholder} 
          value={value} 
        />
      </div>
    </div>
  );
}
