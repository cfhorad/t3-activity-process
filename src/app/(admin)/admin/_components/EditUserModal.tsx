import {
	Avatar,
	Button,
	Checkbox,
	cn,
	Label,
	ListBox,
	Modal,
	Select,
	Spinner,
} from "@heroui/react";
import { Edit2, RefreshCw } from "lucide-react";
import type { User } from "~/server/better-auth/config";
import type { AreaItem, UserItem } from "../_hooks/useAdminDashboard";

interface EditUserModalProps {
	isOpen: boolean;
	onOpenChange: (val: boolean) => void;
	editingUser: UserItem | null;
	isSuperAdmin: boolean;
	selectedRole: "ADMIN" | "MANAGER" | "VIEWER";
	setSelectedRole: (val: "ADMIN" | "MANAGER" | "VIEWER") => void;
	selectedStatus: "pending" | "active" | "suspended";
	setSelectedStatus: (val: "pending" | "active" | "suspended") => void;
	selectedAreaIds: string[];
	toggleAreaSelection: (areaId: string) => void;
	areas: AreaItem[] | undefined;
	loadingAreas: boolean;
	currentUser: User & {
		areaIds: string[];
	};
	handleUpdateUserSubmit: () => void;
	isPending: boolean;
}

export function EditUserModal({
	isOpen,
	onOpenChange,
	editingUser,
	isSuperAdmin,
	selectedRole,
	setSelectedRole,
	selectedStatus,
	setSelectedStatus,
	selectedAreaIds,
	toggleAreaSelection,
	areas,
	loadingAreas,
	currentUser,
	handleUpdateUserSubmit,
	isPending,
}: EditUserModalProps) {
	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} variant="blur">
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-lg">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-primary/10 text-primary">
							<Edit2 className="size-5" />
						</Modal.Icon>
						<Modal.Heading>編輯使用者權限設定</Modal.Heading>
					</Modal.Header>

					<Modal.Body className="max-h-[70vh] space-y-4 overflow-y-auto py-4 pr-1">
						{editingUser && (
							<div className="flex items-center gap-3 rounded-xl border border-default-200 bg-default-50 p-3">
								<Avatar className="size-10 rounded-full">
									{editingUser.image ? (
										<Avatar.Image src={editingUser.image} />
									) : (
										<Avatar.Fallback>
											{(editingUser.name ?? editingUser.email ?? "M")
												.charAt(0)
												.toUpperCase()}
										</Avatar.Fallback>
									)}
								</Avatar>
								<div>
									<p className="font-bold text-sm">
										{editingUser.name ?? "未設定姓名"}
									</p>
									<p className="text-muted text-xs">{editingUser.email}</p>
								</div>
							</div>
						)}

						{/* Role Setting */}
						<div className="space-y-1.5">
							<span className="font-bold text-default-600 text-xs">
								系統角色
							</span>
							<Select
								isDisabled={editingUser?.role === "ADMIN" && !isSuperAdmin}
								onChange={(val) =>
									setSelectedRole(val as "ADMIN" | "MANAGER" | "VIEWER")
								}
								value={selectedRole}
							>
								<Select.Trigger>
									<Select.Value />
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox selectionMode="single">
										{isSuperAdmin && (
											<ListBox.Item id="ADMIN" textValue="超級管理員 (ADMIN)">
												超級管理員 (ADMIN)
												<ListBox.ItemIndicator />
											</ListBox.Item>
										)}
										<ListBox.Item
											id="MANAGER"
											textValue="地區審核管理員 (MANAGER)"
										>
											地區審核管理員 (MANAGER)
											<ListBox.ItemIndicator />
										</ListBox.Item>
										<ListBox.Item
											id="VIEWER"
											textValue="一般核對使用者 (VIEWER)"
										>
											一般核對使用者 (VIEWER)
											<ListBox.ItemIndicator />
										</ListBox.Item>
									</ListBox>
								</Select.Popover>
							</Select>
							<p className="text-[10px] text-muted">
								* 超級管理員擁有所有地區之全域讀寫與刪除權限；MANAGER
								可以審核並管理核准地區之數據與成員。
							</p>
						</div>

						{/* Status Setting */}
						<div className="space-y-1.5">
							<span className="font-bold text-default-600 text-xs">
								帳號狀態
							</span>
							<Select
								onChange={(val) =>
									setSelectedStatus(val as "pending" | "active" | "suspended")
								}
								value={selectedStatus}
							>
								<Select.Trigger>
									<Select.Value />
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox selectionMode="single">
										<ListBox.Item id="active" textValue="啟用中 (active)">
											啟用中 (active)
											<ListBox.ItemIndicator />
										</ListBox.Item>
										<ListBox.Item id="pending" textValue="待審核中 (pending)">
											待審核中 (pending)
											<ListBox.ItemIndicator />
										</ListBox.Item>
										<ListBox.Item id="suspended" textValue="已停權 (suspended)">
											已停權 (suspended)
											<ListBox.ItemIndicator />
										</ListBox.Item>
									</ListBox>
								</Select.Popover>
							</Select>
							<p className="text-[10px] text-muted">
								* 停權中的帳號將被強制登出並阻斷所有 tRPC 操作門禁。
							</p>
						</div>

						{/* Multi-Select Areas */}
						<div className="space-y-2">
							<span className="font-bold text-default-600 text-xs">
								核准之管轄/所屬地區（可複選）
							</span>
							<p className="-mt-1 text-[10px] text-muted">
								勾選即代表**核准**該地區。若全部勾選清除，該使用者將因無核准地區而在登入時重新被引體至審核等待頁面。
							</p>

							{loadingAreas ? (
								<div className="flex items-center gap-2 p-2 text-muted text-xs">
									<RefreshCw className="size-4 animate-spin" />{" "}
									讀取營運地區中...
								</div>
							) : (
								<div className="grid grid-cols-2 gap-2 rounded-2xl border border-default-200 bg-default-50 p-3">
									{areas?.map((a) => {
										const isChecked = selectedAreaIds.includes(a.id);
										const isOwnScope =
											isSuperAdmin || currentUser.areaIds.includes(a.id);

										return (
											<Checkbox
												id={`area-${a.id}`}
												isDisabled={!isOwnScope}
												isSelected={isChecked}
												key={a.id}
												onChange={() => isOwnScope && toggleAreaSelection(a.id)}
												variant="secondary"
											>
												<Checkbox.Control>
													<Checkbox.Indicator />
												</Checkbox.Control>
												<Checkbox.Content>
													<Label
														className={cn(
															"font-bold text-xs",
															isChecked && "text-primary",
														)}
														htmlFor={`area-${a.id}`}
													>
														{a.name}
													</Label>
													<span className="text-[9px] text-muted">{a.id}</span>
												</Checkbox.Content>
											</Checkbox>
										);
									})}
								</div>
							)}
						</div>
					</Modal.Body>

					<Modal.Footer className="flex items-center gap-2">
						<Button
							onPress={() => onOpenChange(false)}
							size="sm"
							variant="ghost"
						>
							取消
						</Button>
						<Button
							className="font-bold text-white shadow-sm"
							isPending={isPending}
							onPress={handleUpdateUserSubmit}
							size="sm"
							variant="primary"
						>
							{({ isPending }) => (
								<>
									{isPending && <Spinner color="current" size="sm" />}
									儲存權限設定
								</>
							)}
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
