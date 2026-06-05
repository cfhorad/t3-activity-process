"use client";

import { Button, Card, Modal, Tabs, TextArea } from "@heroui/react";
import {
	AlertTriangle,
	Building,
	Globe,
	RefreshCw,
	ShieldAlert,
	UserCheck,
	Users,
} from "lucide-react";
import type { User } from "~/server/better-auth/config";
import type { PendingApprovalItem } from "../_hooks/useAdminDashboard";
import { useAdminDashboard } from "../_hooks/useAdminDashboard";
import { AreaManagementPanel } from "./AreaManagementPanel";
import { EditUserModal } from "./EditUserModal";
import { PendingApprovalPanel } from "./PendingApprovalPanel";
import { UserManagementPanel } from "./UserManagementPanel";

// ─── TYPES ───────────────────────────────────────────────────

interface AdminDashboardClientProps {
	currentUser: User & {
		role: "ADMIN" | "MANAGER" | "VIEWER";
		areaIds: string[];
	};
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────

/**
 * 1. Overview Stats Cards Component
 */
interface StatsCardsProps {
	loadingApprovals: boolean;
	pendingApprovalsCount: number;
	loadingUsers: boolean;
	usersCount: number;
	loadingAreas: boolean;
	areasCount: number;
}

function StatsCards({
	loadingApprovals,
	pendingApprovalsCount,
	loadingUsers,
	usersCount,
	loadingAreas,
	areasCount,
}: StatsCardsProps) {
	return (
		<div className="grid grid-cols-3 gap-2 md:gap-4">
			<Card className="border border-border/40 bg-linear-to-br from-danger/10 via-background to-background p-3 shadow-sm">
				<div className="flex items-center justify-between">
					<div>
						<p className="font-semibold text-[10px] text-muted md:text-xs">
							待審核分會
						</p>
						<h3 className="mt-1 font-black text-danger text-xl md:text-2xl">
							{loadingApprovals ? (
								<RefreshCw className="size-5 animate-spin" />
							) : (
								pendingApprovalsCount
							)}
						</h3>
					</div>
					<div className="rounded-xl bg-danger-soft-hover p-2 text-danger">
						<ShieldAlert className="size-4 md:size-5" />
					</div>
				</div>
			</Card>

			<Card className="border border-border/40 bg-linear-to-br from-success/10 via-background to-background p-3 shadow-sm">
				<div className="flex items-center justify-between">
					<div>
						<p className="font-semibold text-[10px] text-muted md:text-xs">
							總成員數
						</p>
						<h3 className="mt-1 font-black text-success text-xl md:text-2xl">
							{loadingUsers ? (
								<RefreshCw className="size-5 animate-spin" />
							) : (
								usersCount
							)}
						</h3>
					</div>
					<div className="rounded-xl bg-success-soft-hover p-2 text-success">
						<Users className="size-4 md:size-5" />
					</div>
				</div>
			</Card>

			<Card className="border border-border/40 bg-linear-to-br from-warning/10 via-background to-background p-3 shadow-sm">
				<div className="flex items-center justify-between">
					<div>
						<p className="font-semibold text-[10px] text-muted md:text-xs">
							分會總數
						</p>
						<h3 className="mt-1 font-black text-warning text-xl md:text-2xl">
							{loadingAreas ? (
								<RefreshCw className="size-5 animate-spin" />
							) : (
								areasCount
							)}
						</h3>
					</div>
					<div className="rounded-2xl bg-warning-soft-hover p-3 text-warning">
						<Globe className="size-6" />
					</div>
				</div>
			</Card>
		</div>
	);
}

/**
 * 2. Reject Application Confirmation Modal Component
 */
interface RejectApplicationModalProps {
	isOpen: boolean;
	onOpenChange: (val: boolean) => void;
	rejectingApplication: PendingApprovalItem | null;
	rejectedReason: string;
	setRejectedReason: (val: string) => void;
	handleRejectSubmit: () => void;
	isPending: boolean;
}

function RejectApplicationModal({
	isOpen,
	onOpenChange,
	rejectingApplication,
	rejectedReason,
	setRejectedReason,
	handleRejectSubmit,
	isPending,
}: RejectApplicationModalProps) {
	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} variant="blur">
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-danger/10 text-danger">
							<AlertTriangle className="size-5" />
						</Modal.Icon>
						<Modal.Heading>拒絕分會申請</Modal.Heading>
					</Modal.Header>

					<Modal.Body className="space-y-4 py-4">
						{rejectingApplication && (
							<div className="space-y-1 rounded-xl border border-border/40 bg-surface-secondary p-3 text-xs">
								<p>
									<strong>申請人：</strong>
									{rejectingApplication.user?.name ?? "無"} (
									{rejectingApplication.user?.email})
								</p>
								<p>
									<strong>申請分會：</strong>
									{rejectingApplication.area?.name} (
									{rejectingApplication.areaId})
								</p>
							</div>
						)}
						<div className="space-y-1.5">
							<span className="font-bold text-foreground text-xs">
								請輸入拒絕原因 (選填)
							</span>
							<TextArea
								aria-label="拒絕原因"
								onChange={(e) => setRejectedReason(e.target.value)}
								placeholder="提供退件原因給使用者參考，例如「資訊不完整」、「不屬於該分區」..."
								rows={3}
								value={rejectedReason}
								variant="secondary"
							/>
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
							className="font-bold text-white"
							isPending={isPending}
							onPress={handleRejectSubmit}
							size="sm"
							variant="danger"
						>
							確認拒絕
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

// ─── MAIN PRESENTATIONAL COMPONENT ───────────────────────────

export function AdminDashboardClient({
	currentUser,
}: AdminDashboardClientProps) {
	const {
		activeTab,
		setActiveTab,
		isSuperAdmin,
		loadingApprovals,
		pendingApprovals,
		refetchApprovals,
		approveMutation,
		rejectMutation,
		loadingUsers,
		refetchUsers,
		updateRoleAreasMutation,
		loadingAreas,
		areas,
		refetchAreas,
		createAreaMutation,
		deleteAreaMutation,
		editModalOpen,
		setEditModalOpen,
		editingUser,
		selectedRole,
		setSelectedRole,
		selectedStatus,
		setSelectedStatus,
		selectedAreaIds,
		rejectModalOpen,
		setRejectModalOpen,
		rejectingApplication,
		rejectedReason,
		setRejectedReason,
		userSearch,
		setUserSearch,
		newAreaId,
		setNewAreaId,
		newAreaName,
		setNewAreaName,
		handleApprove,
		handleRejectClick,
		handleRejectSubmit,
		handleEditClick,
		handleUpdateUserSubmit,
		handleCreateArea,
		handleDeleteArea,
		toggleAreaSelection,
		filteredUsers,
	} = useAdminDashboard({ currentUser });

	return (
		<div className="space-y-6">
			{/* Overview stats cards */}
			<StatsCards
				areasCount={areas?.length ?? 0}
				loadingApprovals={loadingApprovals}
				loadingAreas={loadingAreas}
				loadingUsers={loadingUsers}
				pendingApprovalsCount={pendingApprovals?.length ?? 0}
				usersCount={filteredUsers?.length ?? 0}
			/>

			{/* Main tabs layout container */}
			<Card className="border border-border/40 bg-surface/60 p-2 backdrop-blur-md">
				<Tabs
					className="w-full"
					onSelectionChange={(key) => setActiveTab(String(key))}
					selectedKey={activeTab}
				>
					<Tabs.ListContainer>
						<Tabs.List className="border-separator border-b pb-0 *:data-[selected=true]:text-primary-foreground">
							<Tabs.Tab
								className="flex items-center gap-2 whitespace-nowrap"
								id="pending"
							>
								<UserCheck className="size-4" />
								審核申請
								{pendingApprovals && pendingApprovals.length > 0 && (
									<span className="ml-1 rounded-full bg-danger px-2 py-0.5 font-black text-[10px] text-white">
										{pendingApprovals.length}
									</span>
								)}
								<Tabs.Indicator />
							</Tabs.Tab>
							<Tabs.Tab
								className="flex items-center gap-2 whitespace-nowrap"
								id="users"
							>
								<Users className="size-4" />
								成員管理
								<Tabs.Indicator />
							</Tabs.Tab>
							<Tabs.Tab
								className="flex items-center gap-2 whitespace-nowrap"
								id="areas"
							>
								<Building className="size-4" />
								分會管理
								<Tabs.Indicator />
							</Tabs.Tab>
						</Tabs.List>
					</Tabs.ListContainer>

					{/* 1. Pending Approvals Panel */}
					<Tabs.Panel className="pt-4" id="pending">
						<PendingApprovalPanel
							approveMutationPending={approveMutation.isPending}
							handleApprove={handleApprove}
							handleRejectClick={handleRejectClick}
							loadingApprovals={loadingApprovals}
							pendingApprovals={pendingApprovals}
							refetchApprovals={refetchApprovals}
							rejectMutationPending={rejectMutation.isPending}
						/>
					</Tabs.Panel>

					{/* 2. User Management Panel */}
					<Tabs.Panel className="pt-4" id="users">
						<UserManagementPanel
							currentUser={currentUser}
							filteredUsers={filteredUsers}
							handleEditClick={handleEditClick}
							loadingUsers={loadingUsers}
							refetchUsers={refetchUsers}
							setUserSearch={setUserSearch}
							userSearch={userSearch}
						/>
					</Tabs.Panel>

					{/* 3. Area Management Panel */}
					<Tabs.Panel className="pt-4" id="areas">
						<AreaManagementPanel
							areas={areas}
							createAreaMutationPending={createAreaMutation.isPending}
							deleteAreaMutationPending={deleteAreaMutation.isPending}
							handleCreateArea={handleCreateArea}
							handleDeleteArea={handleDeleteArea}
							isSuperAdmin={isSuperAdmin}
							loadingAreas={loadingAreas}
							newAreaId={newAreaId}
							newAreaName={newAreaName}
							refetchAreas={refetchAreas}
							setNewAreaId={setNewAreaId}
							setNewAreaName={setNewAreaName}
						/>
					</Tabs.Panel>
				</Tabs>
			</Card>

			{/* ==================== 4. Modal: Reject Area Application ==================== */}
			<RejectApplicationModal
				handleRejectSubmit={handleRejectSubmit}
				isOpen={rejectModalOpen}
				isPending={rejectMutation.isPending}
				onOpenChange={setRejectModalOpen}
				rejectedReason={rejectedReason}
				rejectingApplication={rejectingApplication}
				setRejectedReason={setRejectedReason}
			/>

			{/* ==================== 5. Modal: Edit User (Role, Status, Approved Areas) ==================== */}
			<EditUserModal
				areas={areas}
				currentUser={currentUser}
				editingUser={editingUser}
				handleUpdateUserSubmit={handleUpdateUserSubmit}
				isOpen={editModalOpen}
				isPending={updateRoleAreasMutation.isPending}
				isSuperAdmin={isSuperAdmin}
				loadingAreas={loadingAreas}
				onOpenChange={setEditModalOpen}
				selectedAreaIds={selectedAreaIds}
				selectedRole={selectedRole}
				selectedStatus={selectedStatus}
				setSelectedRole={setSelectedRole}
				setSelectedStatus={setSelectedStatus}
				toggleAreaSelection={toggleAreaSelection}
			/>
		</div>
	);
}
