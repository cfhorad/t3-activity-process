# Antigravity IDE - AI 開發規範 (2026 T3 Edition)

你現在是 **Antigravity IDE** 的核心開發助手。本專案採用最新一代的 T3 Stack 變體，追求極致的型別安全與 Serverless 效能。

## 🛠 技術棧定義 (Tech Stack)
- **Framework**: Next.js (App Router)
- **UI Framework**: HeroUI v3 (優先調用 MCP Pro 模板)
- **Database**: Neon (Serverless Postgres)
- **ORM**: Drizzle ORM (PostgreSQL Driver)
- **Auth**: Better Auth (with Drizzle Adapter)
- **Storage**: Uploadthing (Image/Media Hosting)
- **API**: tRPC (Internal Type-safe API)

---

## 🎯 開發守則與邏輯

### 1. 資料庫與 Schema (Drizzle + Neon)
- **單一來源**: 所有的 Schema 必須定義在 `src/server/db/schema.ts`。
- **連線優化 (防止頻繁喚醒)**: 
  - **開發環境**: 使用 `postgres-js` 並配合 Singleton 模式（`globalThis`），避免 HMR 導致連線數爆炸。
  - **生產環境**: 使用 `@neondatabase/serverless` 的 `neon-http`。這是無狀態的 HTTP 連線，能確保資料庫在閒置時正確進入 Scale-to-Zero 狀態，節省資源並避免冷啟動頻率。
- **遷移工作流**: 變更 Schema 後，優先使用 `npx drizzle-kit push` 進行開發環境同步；生產環境使用 `npx drizzle-kit generate` 產生遷移檔。
- **型別推導**: 善用 `InferSelectModel` 和 `InferInsertModel` 來產生 TypeScript 型別。

### 2. 身份驗證 (Better Auth)
- **核心路徑**: 認證邏輯位於 `src/lib/auth.ts`，API 路由位於 `app/api/auth/[...all]/route.ts`。
- **權限控制**: 優先使用 Better Auth 的 **Plugins** (如組織管理、MFA)。
- **伺服器端獲取**: 在 Server Components 中使用 `auth.getSession(headers())` 獲取用戶狀態。

### 3. 檔案處理 (Uploadthing)
- **上傳邏輯**: 所有的上傳路徑 (File Routes) 必須在 `src/app/api/uploadthing/core.ts` 定義。
- **安全性**: 在 `onUploadComplete` 之前，必須進行 `middleware` 權限校驗（結合 Better Auth 狀態）。
- **資料儲存**: 上傳成功後，將回傳的 `fileUrl` 存入 Neon 資料庫對應的欄位。

### 4. API 與狀態管理 (tRPC)
- 所有的資料讀寫優先走 tRPC，除非是極簡單的 Server Action。
- 確保每一條 tRPC Route 都有對應的 **Zod** 輸入驗證。

### 5. UI 與組件開發 (HeroUI v3)
- **組件優先**: 所有的 UI 開發必須優先使用 **HeroUI v3** 組件。
- **Provider 架構**: v3 已移除全域的 `HeroUIProvider`。
  - **通知系統**: 必須在 `layout.tsx` 根部加入 `<Toast.Provider />`。
  - **主題切換**: 應使用 `next-themes` 的 `ThemeProvider`，不再透過 HeroUI 核心 Provider。
- **Button / Link 樣式規範**:
  - **屬性合併**: `buttonVariants` 不再支援獨立的 `color` 屬性。顏色已整合進 `variant` (例如: `variant="primary"`, `variant="danger-soft"`)。
  - **移除的 Variant**: `flat`, `shadow`, `bordered` 已被移除。
    - 使用 `outline` 取代 `bordered`。
    - 使用 `danger-soft` 取代 `flat` / `danger`。
    - 對於 `shadow` 效果，應手動添加 Tailwind v4 類別 (例如: `shadow-lg shadow-primary/20`)。
- **Selection API (Beta)**: 在 HeroUI v3 Beta 中，`Select` 的 `selectedKey` 與 `onSelectionChange` 已標註為 **deprecated**。
  - **Single Selection**: 應改用 `value` 與 `onChange` 屬性。
  - **State**: 使用純值型別 (string, number) 作為 useState 的初始值，避免在單選模式下使用複雜的 `Set<Key>`。
- **Dropdown 嵌套錯誤 (Hydration Fix)**: 
  - **問題**: 在 `Dropdown.Trigger` 內放置 `Button` 會導致 `<button> cannot be a descendant of <button>` 錯誤。
  - **解決方案**: 移除 `Dropdown.Trigger`，直接將 `Button` 放在 `Dropdown` 下作為第一個子元件。HeroUI v3 會自動將 Button 識別為觸發器。

### 6. TypeScript 與錯誤處理 (Error Handling)
- **避免使用 `any` 型別**: 在 `try...catch` 區塊中，絕對不要使用 `catch (error: any)`。這會觸發 ESLint 警告。TypeScript 中的錯誤預設為 `unknown`，應使用型別斷言 (Type Assertion) 或型別守衛 (Type Guard) 來安全地存取錯誤屬性。
  - **正確寫法範例**: 
    ```typescript
    catch (error) {
      const dbError = error as { code?: string; constraint_name?: string };
      if (dbError?.code === '23505') {
        // 處理特定資料庫錯誤...
      }
      throw error;
    }
    ```
### 7. 日期與時區處理 (Date & Timezone Handling)
- **避免使用原生 Date 物件處理「純日期」**: JavaScript 原生的 `Date` 物件包含時區資訊，使用 `toISOString()` 等方法時常會因為 UTC 偏移導致日期在午夜前後發生跳日（Timezone Trap）。
- **使用 `@internationalized/date`**: 對於只需要「年月日」的場景（如用餐登記），應統一使用 `@internationalized/date` 的 `CalendarDate`。
  - **優點**: 完全不包含時區與時間資訊，保證在任何地理位置看到的日期字串都一致。
  - **Today 獲取**: 應使用 `today(getLocalTimeZone())` 來獲取用戶當前所在時區的日曆日期。
  - **格式化**: 直接使用 `date.toString()` 即可獲得標準的 `YYYY-MM-DD` 格式，避免手動處理字串。

### 8. 資料快取與效能優化 (Next.js Data Cache)
為了降低 Neon 資料庫的運算成本 (Compute Usage) 並提升響應速度，應積極使用 Next.js 的 Data Cache 機制。
- **快取方法**: 使用 `next/cache` 的 `unstable_cache` 封裝資料讀取邏輯。
- **快取函數規範**:
  - **獨立定義**: 快取函數應定義在 tRPC Router 之外，避免每次渲染時重複建立。
  - **直接調用 db**: 快取函數內部應直接從 `~/server/db` 導入 `db` 實例，不要使用傳入的 `ctx.db`（避免非序列化物件傳入引發錯誤）。
  - **標籤管理 (Tags)**: 必須賦予語義化的 `tags`（如 `['stats']`, `['meals']`, `['jobs']`），以便進行精確的「隨選重驗證」(On-Demand Revalidation)。
- **安全與隔離 (Keying)**:
  - 對於具有權限區隔或用戶私有的資料，快取鍵 (Cache Keys) 必須包含用戶唯一識別碼（如 `userId`）或角色識別，防止跨用戶資料洩漏。
- **隨選重驗證 (Revalidation)**:
  - 在執行 `insert`, `update`, `delete` 等異動操作後，必須立即調用 `revalidateTag(tagName)` 來清除對應的快取，確保 UI 資料即時更新。

### 9. Google Sheets 資料處理與格式化 (Data Handling)
- **動態控制列 (Control Rows Logic)**:
  - **第一列 (Inclusion Row)**: 決定哪些欄位需要匯入資料庫。只有在該列值為 `true` 的欄位才會被儲存。
  - **第二列 (Filter Configuration Row)**: 決定哪些欄位支援「多選過濾」。若值為 `true`，該欄位的值會以逗號 (`,`) 或換行符拆分並去重，生成多選下拉選單。
  - **「All」排除邏輯**: 如果儲存格的值完全等於 `"All"`（不分大小寫），該列會被標記為 `isAlwaysShow: true`，不論過濾條件為何都會顯示在前端。
  - **資料列**: 真正的資料從第三列 (Data Row) 開始。
- **後端正規化 (Backend Normalization)**: 
  - 在將 Google Sheets 資料同步至資料庫時，必須統一將所有字串中的 `\r\n` 替換為標準的 `\n`。
  - 這能確保跨平台輸入的資料在 JSONB 儲存中保持一致性，防止比對或過濾時因隱藏字元導致錯誤。
- **前端顯示 (Frontend Presentation)**:
  - 為了在 HeroUI 組件中完整呈現 Google Sheet 儲存格內的換行 (Alt+Enter) 與空格，必須對內容容器使用 `whitespace-pre-wrap` 類別。
  - **適用場景**: `Table.Cell`、`ListBox.Item`、`Table.Column` 等需要保留原始格式的區域。

---

## 📂 專案結構規範
- `src/app/`: 頁面、佈局與 Server Actions。
- `src/server/api/routers/`: tRPC 路由定義。
- `src/server/db/`: 資料庫配置與 Drizzle Schema。
- `src/lib/`: 第三方服務封裝 (auth.ts, uploadthing.ts)。
- `src/components/`: 業務邏輯組件（基於 HeroUI）。

---

## 📝 實作檢查清單
- [ ] UI 是否符合 HeroUI v3 的設計規範？
- [ ] tRPC 路由是否已定義對應的 Zod Schema？
- [ ] Schema 變更是否已執行 `drizzle-kit push`？
- [ ] 敏感操作是否已通過 `auth.getSession()` 驗證身份？
- [ ] 圖片上傳是否具備正確的權限校驗與 Loading 狀態？
- [ ] Neon 的連接字串是否已在 `.env` 中正確配置？
- [ ] 生產環境是否已正確切換為 `neon-http` 連線模式？
- [ ] 是否已手動在 Neon Console 檢查 Scale-to-Zero 的閒置超時設定？
- [ ] 頻繁或耗時的讀取操作是否已實作 `unstable_cache`？
- [ ] 異動操作後是否已調用 `revalidateTag` 清除對應快取？
- [ ] Google Sheets 資料同步時是否已執行 `\r\n` -> `\n` 的正規化？
- [ ] UI 組件（如 Table Cell）是否已加上 `whitespace-pre-wrap` 類別以保留換行？
- [ ] 是否正確處理 Google Sheet 的動態控制列（Inclusion & Filter Config）？
- [ ] 多選過濾器是否正確處理逗號分隔值並移除多餘空格？
- [ ] 包含 "All" 的列是否在任何過濾條件下都保持顯示？

---

## 🤖 AI 代理人輔助索引 (HeroUI v3)

<!-- HEROUI-REACT-AGENTS-MD-START -->
[HeroUI React v3 Docs Index]|root: ./.heroui-docs/react|STOP. What you remember about HeroUI React v3 is WRONG for this project. Always search docs and read before any task.|If docs missing, run this command first: heroui agents-md --react --output AGENTS.md|components/(buttons):{button-group.mdx,button.mdx,close-button.mdx,toggle-button-group.mdx,toggle-button.mdx}|components/(collections):{dropdown.mdx,list-box.mdx,tag-group.mdx}|components/(colors):{color-area.mdx,color-field.mdx,color-picker.mdx,color-slider.mdx,color-swatch-picker.mdx,color-swatch.mdx}|components/(controls):{slider.mdx,switch.mdx}|components/(data-display):{badge.mdx,chip.mdx,table.mdx}|components/(date-and-time):{calendar.mdx,date-field.mdx,date-picker.mdx,date-range-picker.mdx,range-calendar.mdx,time-field.mdx}|components/(feedback):{alert.mdx,meter.mdx,progress-bar.mdx,progress-circle.mdx,skeleton.mdx,spinner.mdx}|components/(forms):{checkbox-group.mdx,checkbox.mdx,description.mdx,error-message.mdx,field-error.mdx,fieldset.mdx,form.mdx,input-group.mdx,input-otp.mdx,input.mdx,label.mdx,number-field.mdx,radio-group.mdx,search-field.mdx,text-area.mdx,text-field.mdx}|components/(layout):{card.mdx,separator.mdx,surface.mdx,toolbar.mdx}|components/(media):{avatar.mdx}|components/(navigation):{accordion.mdx,breadcrumbs.mdx,disclosure-group.mdx,disclosure.mdx,link.mdx,pagination.mdx,tabs.mdx}|components/(overlays):{alert-dialog.mdx,drawer.mdx,modal.mdx,popover.mdx,toast.mdx,tooltip.mdx}|components/(pickers):{autocomplete.mdx,combo-box.mdx,select.mdx}|components/(typography):{kbd.mdx}|components/(utilities):{scroll-shadow.mdx}|getting-started/(handbook):{animation.mdx,colors.mdx,composition.mdx,styling.mdx,theming.mdx}|getting-started/(overview):{design-principles.mdx,quick-start.mdx}|getting-started/(ui-for-agents):{agent-skills.mdx,agents-md.mdx,llms-txt.mdx,mcp-server.mdx}|releases:{v3-0-0-alpha-32.mdx,v3-0-0-alpha-33.mdx,v3-0-0-alpha-34.mdx,v3-0-0-alpha-35.mdx,v3-0-0-beta-1.mdx,v3-0-0-beta-2.mdx,v3-0-0-beta-3.mdx,v3-0-0-beta-4.mdx,v3-0-0-beta-6.mdx,v3-0-0-beta-7.mdx,v3-0-0-beta-8.mdx,v3-0-0-rc-1.mdx,v3-0-0.mdx,v3-0-2.mdx,v3-0-3.mdx}|demos/accordion:{basic.tsx,controlled.tsx,custom-indicator.tsx,custom-render-function.tsx,custom-styles.tsx,disabled.tsx,faq.tsx,multiple.tsx,surface.tsx,without-separator.tsx}|demos/alert-dialog:{backdrop-variants.tsx,close-methods.tsx,controlled.tsx,custom-animations.tsx,custom-backdrop.tsx,custom-icon.tsx,custom-portal.tsx,custom-trigger.tsx,default.tsx,dismiss-behavior.tsx,placements.tsx,sizes.tsx,statuses.tsx,with-close-button.tsx}|demos/alert:{basic.tsx}|demos/autocomplete:{allows-empty-collection.tsx,asynchronous-filtering.tsx,controlled-open-state.tsx,controlled.tsx,custom-indicator.tsx,default.tsx,disabled.tsx,email-recipients.tsx,full-width.tsx,location-search.tsx,multiple-select.tsx,required.tsx,single-select.tsx,tag-group-selection.tsx,user-selection-multiple.tsx,user-selection.tsx,variants.tsx,with-description.tsx,with-disabled-options.tsx,with-sections.tsx}|demos/avatar:{basic.tsx,colors.tsx,custom-styles.tsx,fallback.tsx,group.tsx,sizes.tsx,variants.tsx}|demos/badge:{basic.tsx,colors.tsx,dot.tsx,placements.tsx,sizes.tsx,variants.tsx,with-content.tsx}|demos/breadcrumbs:{basic.tsx,custom-render-function.tsx,custom-separator.tsx,disabled.tsx,level-2.tsx,level-3.tsx}|demos/button-group:{basic.tsx,disabled.tsx,full-width.tsx,orientation.tsx,sizes.tsx,variants.tsx,with-icons.tsx,without-separator.tsx}|demos/button:{basic.tsx,custom-render-function.tsx,custom-variants.tsx,disabled.tsx,full-width.tsx,icon-only.tsx,loading-state.tsx,loading.tsx,outline-variant.tsx,ripple-effect.tsx,sizes.tsx,social.tsx,variants.tsx,with-icons.tsx}|demos/calendar:{basic.tsx,booking-calendar.tsx,controlled.tsx,custom-icons.tsx,custom-styles.tsx,default-value.tsx,disabled.tsx,focused-value.tsx,international-calendar.tsx,min-max-dates.tsx,multiple-months.tsx,read-only.tsx,unavailable-dates.tsx,with-indicators.tsx,year-picker.tsx}|demos/card:{default.tsx,horizontal.tsx,variants.tsx,with-avatar.tsx,with-form.tsx,with-images.tsx}|demos/checkbox-group:{basic.tsx,controlled.tsx,custom-render-function.tsx,disabled.tsx,features-and-addons.tsx,indeterminate.tsx,on-surface.tsx,validation.tsx,with-custom-indicator.tsx}|demos/checkbox:{basic.tsx,controlled.tsx,custom-indicator.tsx,custom-render-function.tsx,custom-styles.tsx,default-selected.tsx,disabled.tsx,form.tsx,full-rounded.tsx,indeterminate.tsx,invalid.tsx,render-props.tsx,variants.tsx,with-description.tsx,with-label.tsx}|demos/chip:{basic.tsx,statuses.tsx,variants.tsx,with-icon.tsx}|demos/close-button:{default.tsx,interactive.tsx,variants.tsx,with-custom-icon.tsx}|demos/color-area:{basic.tsx,controlled.tsx,custom-render-function.tsx,disabled.tsx,space-and-channels.tsx,with-dots.tsx}|demos/color-field:{basic.tsx,channel-editing.tsx,controlled.tsx,custom-render-function.tsx,disabled.tsx,form-example.tsx,full-width.tsx,invalid.tsx,on-surface.tsx,required.tsx,variants.tsx,with-description.tsx}|demos/color-picker:{basic.tsx,controlled.tsx,with-fields.tsx,with-sliders.tsx,with-swatches.tsx}|demos/color-slider:{alpha-channel.tsx,basic.tsx,channels.tsx,controlled.tsx,custom-render-function.tsx,disabled.tsx,rgb-channels.tsx,vertical.tsx}|demos/color-swatch-picker:{basic.tsx,controlled.tsx,custom-indicator.tsx,custom-render-function.tsx,default-value.tsx,disabled.tsx,sizes.tsx,stack-layout.tsx,variants.tsx}|demos/color-swatch:{accessibility.tsx,basic.tsx,custom-render-function.tsx,custom-styles.tsx,shapes.tsx,sizes.tsx,transparency.tsx}|demos/combo-box:{allows-custom-value.tsx,asynchronous-loading.tsx,controlled-input-value.tsx,controlled.tsx,custom-filtering.tsx,custom-indicator.tsx,custom-render-function.tsx,custom-value.tsx,default-selected-key.tsx,default.tsx,disabled.tsx,full-width.tsx,menu-trigger.tsx,on-surface.tsx,required.tsx,with-description.tsx,with-disabled-options.tsx,with-sections.tsx}|demos/date-field:{basic.tsx,controlled.tsx,custom-render-function.tsx,disabled.tsx,form-example.tsx,full-width.tsx,granularity.tsx,invalid.tsx,on-surface.tsx,required.tsx,variants.tsx,with-description.tsx,with-prefix-and-suffix.tsx,with-prefix-icon.tsx,with-suffix-icon.tsx,with-validation.tsx}|demos/date-picker:{basic.tsx,controlled.tsx,custom-render-function.tsx,disabled.tsx,form-example.tsx,format-options-no-ssr.tsx,format-options.tsx,international-calendar.tsx,with-custom-indicator.tsx,with-validation.tsx}|demos/date-range-picker:{basic.tsx,controlled.tsx,custom-render-function.tsx,disabled.tsx,form-example.tsx,format-options-no-ssr.tsx,format-options.tsx,input-container.tsx,international-calendar.tsx,with-custom-indicator.tsx,with-validation.tsx}|demos/description:{basic.tsx}|demos/disclosure-group:{basic.tsx,controlled.tsx}|demos/disclosure:{basic.tsx,custom-render-function.tsx}|demos/drawer:{backdrop-variants.tsx,basic.tsx,controlled.tsx,navigation.tsx,non-dismissable.tsx,placements.tsx,scrollable-content.tsx,with-form.tsx}|demos/dropdown:{controlled-open-state.tsx,controlled.tsx,custom-trigger.tsx,default.tsx,long-press-trigger.tsx,single-with-custom-indicator.tsx,with-custom-submenu-indicator.tsx,with-descriptions.tsx,with-disabled-items.tsx,with-icons.tsx,with-keyboard-shortcuts.tsx,with-multiple-selection.tsx,with-section-level-selection.tsx,with-sections.tsx,with-single-selection.tsx,with-submenus.tsx}|demos/error-message:{basic.tsx,with-tag-group.tsx}|demos/field-error:{basic.tsx}|demos/fieldset:{basic.tsx,on-surface.tsx}|demos/form:{basic.tsx,custom-render-function.tsx}|demos/input-group:{default.tsx,disabled.tsx,full-width.tsx,invalid.tsx,on-surface.tsx,password-with-toggle.tsx,required.tsx,variants.tsx,with-badge-suffix.tsx,with-copy-suffix.tsx,with-icon-prefix-and-copy-suffix.tsx,with-icon-prefix-and-text-suffix.tsx,with-keyboard-shortcut.tsx,with-loading-suffix.tsx,with-prefix-and-suffix.tsx,with-prefix-icon.tsx,with-suffix-icon.tsx,with-text-prefix.tsx,with-text-suffix.tsx,with-textarea.tsx}|demos/input-otp:{basic.tsx,controlled.tsx,disabled.tsx,form-example.tsx,four-digits.tsx,on-complete.tsx,on-surface.tsx,variants.tsx,with-pattern.tsx,with-validation.tsx}|demos/input:{basic.tsx,controlled.tsx,full-width.tsx,on-surface.tsx,types.tsx,variants.tsx}|demos/kbd:{basic.tsx,inline.tsx,instructional.tsx,navigation.tsx,special.tsx,variants.tsx}|demos/label:{basic.tsx}|demos/link:{basic.tsx,custom-icon.tsx,custom-render-function.tsx,icon-placement.tsx,underline-and-offset.tsx,underline-offset.tsx,underline-variants.tsx}|demos/list-box:{controlled.tsx,custom-check-icon.tsx,custom-render-function.tsx,default.tsx,multi-select.tsx,virtualization.tsx,with-disabled-items.tsx,with-sections.tsx}|demos/meter:{basic.tsx,colors.tsx,custom-value.tsx,sizes.tsx,without-label.tsx}|demos/modal:{backdrop-variants.tsx,close-methods.tsx,controlled.tsx,custom-animations.tsx,custom-backdrop.tsx,custom-portal.tsx,custom-trigger.tsx,default.tsx,dismiss-behavior.tsx,placements.tsx,scroll-comparison.tsx,sizes.tsx,with-form.tsx}|demos/number-field:{basic.tsx,controlled.tsx,custom-icons.tsx,custom-render-function.tsx,disabled.tsx,form-example.tsx,full-width.tsx,on-surface.tsx,required.tsx,validation.tsx,variants.tsx,with-chevrons.tsx,with-description.tsx,with-format-options.tsx,with-step.tsx,with-validation.tsx}|demos/pagination:{basic.tsx,controlled.tsx,custom-icons.tsx,disabled.tsx,simple-prev-next.tsx,sizes.tsx,with-ellipsis.tsx,with-summary.tsx}|demos/popover:{basic.tsx,custom-render-function.tsx,interactive.tsx,placement.tsx,with-arrow.tsx}|demos/progress-bar:{basic.tsx,colors.tsx,custom-value.tsx,indeterminate.tsx,sizes.tsx,without-label.tsx}|demos/progress-circle:{basic.tsx,colors.tsx,custom-svg.tsx,indeterminate.tsx,sizes.tsx,with-label.tsx}|demos/radio-group:{basic.tsx,controlled.tsx,custom-indicator.tsx,custom-render-function.tsx,delivery-and-payment.tsx,disabled.tsx,horizontal.tsx,on-surface.tsx,uncontrolled.tsx,validation.tsx,variants.tsx}|demos/range-calendar:{allows-non-contiguous-ranges.tsx,basic.tsx,booking-calendar.tsx,controlled.tsx,default-value.tsx,disabled.tsx,focused-value.tsx,international-calendar.tsx,invalid.tsx,min-max-dates.tsx,multiple-months.tsx,read-only.tsx,three-months.tsx,unavailable-dates.tsx,with-indicators.tsx,year-picker.tsx}|demos/scroll-shadow:{custom-size.tsx,default.tsx,hide-scroll-bar.tsx,orientation.tsx,visibility-change.tsx,with-card.tsx}|demos/search-field:{basic.tsx,controlled.tsx,custom-icons.tsx,custom-render-function.tsx,disabled.tsx,form-example.tsx,full-width.tsx,on-surface.tsx,required.tsx,validation.tsx,variants.tsx,with-description.tsx,with-keyboard-shortcut.tsx,with-validation.tsx}|demos/select:{asynchronous-loading.tsx,controlled-multiple.tsx,controlled-open-state.tsx,controlled.tsx,custom-indicator.tsx,custom-render-function.tsx,custom-value-multiple.tsx,custom-value.tsx,default.tsx,disabled.tsx,full-width.tsx,multiple-select.tsx,on-surface.tsx,required.tsx,variants.tsx,with-description.tsx,with-disabled-options.tsx,with-sections.tsx}|demos/separator:{basic.tsx,custom-render-function.tsx,manual-variant-override.tsx,variants.tsx,vertical.tsx,with-content.tsx,with-surface.tsx}|demos/skeleton:{animation-types.tsx,basic.tsx,card.tsx,grid.tsx,list.tsx,single-shimmer.tsx,text-content.tsx,user-profile.tsx}|demos/slider:{custom-render-function.tsx,default.tsx,disabled.tsx,range.tsx,vertical.tsx}|demos/spinner:{basic.tsx,colors.tsx,sizes.tsx}|demos/surface:{variants.tsx}|demos/switch:{basic.tsx,controlled.tsx,custom-render-function.tsx,custom-styles.tsx,default-selected.tsx,disabled.tsx,form.tsx,group-horizontal.tsx,group.tsx,label-position.tsx,render-props.tsx,sizes.tsx,with-description.tsx,with-icons.tsx,without-label.tsx}|demos/table:{async-loading.tsx,basic.tsx,column-resizing.tsx,custom-cells.tsx,empty-state.tsx,expandable-rows.tsx,pagination.tsx,secondary-variant.tsx,selection.tsx,sorting.tsx,tanstack-table.tsx,virtualization.tsx}|demos/tabs:{basic.tsx,custom-render-function.tsx,custom-styles.tsx,disabled.tsx,secondary-vertical.tsx,secondary.tsx,vertical.tsx,with-separator.tsx}|demos/tag-group:{basic.tsx,controlled.tsx,custom-render-function.tsx,disabled.tsx,selection-modes.tsx,sizes.tsx,variants.tsx,with-error-message.tsx,with-list-data.tsx,with-prefix.tsx,with-remove-button.tsx}|demos/textarea:{basic.tsx,controlled.tsx,full-width.tsx,on-surface.tsx,rows.tsx,variants.tsx}|demos/textfield:{basic.tsx,controlled.tsx,custom-render-function.tsx,disabled.tsx,full-width.tsx,input-types.tsx,on-surface.tsx,required.tsx,textarea.tsx,validation.tsx,with-description.tsx,with-error.tsx}|demos/time-field:{basic.tsx,controlled.tsx,custom-render-function.tsx,disabled.tsx,form-example.tsx,full-width.tsx,invalid.tsx,on-surface.tsx,required.tsx,with-description.tsx,with-prefix-and-suffix.tsx,with-prefix-icon.tsx,with-suffix-icon.tsx,with-validation.tsx}|demos/toast:{callbacks.tsx,custom-indicator.tsx,custom-queue.tsx,custom-toast.tsx,default.tsx,placements.tsx,promise.tsx,simple.tsx,variants.tsx}|demos/toggle-button-group:{attached.tsx,basic.tsx,controlled.tsx,disabled.tsx,full-width.tsx,orientation.tsx,selection-mode.tsx,sizes.tsx,without-separator.tsx}|demos/toggle-button:{basic.tsx,controlled.tsx,disabled.tsx,icon-only.tsx,sizes.tsx,variants.tsx}|demos/toolbar:{basic.tsx,custom-styles.tsx,vertical.tsx,with-button-group.tsx}|demos/tooltip:{basic.tsx,custom-render-function.tsx,custom-trigger.tsx,placement.tsx,with-arrow.tsx}
<!-- HEROUI-REACT-AGENTS-MD-END -->