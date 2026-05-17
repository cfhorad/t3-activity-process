import { toast } from "@heroui/react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type { User } from "~/server/better-auth/config";
import type { Area, DbUser, UserArea } from "~/server/db/schema";
import { api } from "~/trpc/react";

// ─── Derived types from schema ─────────────────────────────────
// These compose Drizzle schema types with their relations,
// matching the shape returned by tRPC queries with `with: {}`.

export type AreaItem = Pick<Area, "id" | "name">;

export type UserAreaRelation = UserArea & {
	area: AreaItem;
};

export type UserItem = DbUser & {
	areas: UserAreaRelation[];
};

export type PendingApprovalItem = UserArea & {
	user: Pick<DbUser, "id" | "name" | "email" | "image" | "role" | "status">;
	area: AreaItem;
};

export interface UseAdminDashboardProps {
	currentUser: User & {
		role: "ADMIN" | "MANAGER" | "VIEWER";
		areaIds: string[];
	};
}

export function useAdminDashboard({ currentUser }: UseAdminDashboardProps) {
	const [activeTab, setActiveTab] = useState<string>("pending");
	const isSuperAdmin = currentUser.role === "ADMIN";

	const utils = api.useUtils();

	// 1. Pending Approvals
	const {
		data: pendingApprovals,
		isLoading: loadingApprovals,
		refetch: refetchApprovals,
	} = api.admin.getPendingApprovals.useQuery();

	const approveMutation = api.admin.approveAreaApplication.useMutation({
		onSuccess: async () => {
			toast.success("地區申請已核准！");
			await utils.admin.getPendingApprovals.invalidate();
			await utils.admin.getUsers.invalidate();
		},
		onError: (err) => {
			toast.danger(`核准失敗: ${err.message}`);
		},
	});

	const rejectMutation = api.admin.rejectAreaApplication.useMutation({
		onSuccess: async () => {
			toast.success("已拒絕該地區申請。");
			setRejectModalOpen(false);
			setRejectingApplication(null);
			setRejectedReason("");
			await utils.admin.getPendingApprovals.invalidate();
			await utils.admin.getUsers.invalidate();
		},
		onError: (err) => {
			toast.danger(`拒絕失敗: ${err.message}`);
		},
	});

	// 2. Users
	const {
		data: users,
		isLoading: loadingUsers,
		refetch: refetchUsers,
	} = api.admin.getUsers.useQuery();

	const updateRoleAreasMutation = api.admin.updateUserRoleAndAreas.useMutation({
		onSuccess: async () => {
			toast.success("使用者設定已成功更新！");
			setEditModalOpen(false);
			setEditingUser(null);
			await utils.admin.getUsers.invalidate();
			await utils.admin.getPendingApprovals.invalidate();
		},
		onError: (err) => {
			toast.danger(`更新失敗: ${err.message}`);
		},
	});

	// 3. Areas
	const {
		data: areas,
		isLoading: loadingAreas,
		refetch: refetchAreas,
	} = api.admin.getAreas.useQuery();

	const createAreaMutation = api.admin.createArea.useMutation({
		onSuccess: async () => {
			toast.success("成功建立新地區！");
			setNewAreaId("");
			setNewAreaName("");
			await utils.admin.getAreas.invalidate();
		},
		onError: (err) => {
			toast.danger(`建立失敗: ${err.message}`);
		},
	});

	const deleteAreaMutation = api.admin.deleteArea.useMutation({
		onSuccess: async () => {
			toast.success("地區已成功刪除。");
			await utils.admin.getAreas.invalidate();
		},
		onError: (err) => {
			toast.danger(`刪除失敗: ${err.message}`);
		},
	});

	// Edit User Modal
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<UserItem | null>(null);
	const [selectedRole, setSelectedRole] = useState<
		"ADMIN" | "MANAGER" | "VIEWER"
	>("VIEWER");
	const [selectedStatus, setSelectedStatus] = useState<
		"pending" | "active" | "suspended"
	>("pending");
	const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);

	// Reject Area Application Modal
	const [rejectModalOpen, setRejectModalOpen] = useState(false);
	const [rejectingApplication, setRejectingApplication] =
		useState<PendingApprovalItem | null>(null);
	const [rejectedReason, setRejectedReason] = useState("");

	// User list Search & Filter
	const [userSearch, setUserSearch] = useState("");

	// Area creation form
	const [newAreaId, setNewAreaId] = useState("");
	const [newAreaName, setNewAreaName] = useState("");

	const handleApprove = (userId: string, areaId: string) => {
		approveMutation.mutate({ userId, areaId });
	};

	const handleRejectClick = (application: PendingApprovalItem) => {
		setRejectingApplication(application);
		setRejectModalOpen(true);
	};

	const handleRejectSubmit = () => {
		if (!rejectingApplication) return;
		rejectMutation.mutate({
			userId: rejectingApplication.userId,
			areaId: rejectingApplication.areaId,
			rejectedReason: rejectedReason.trim() || undefined,
		});
	};

	const handleEditClick = (userItem: UserItem) => {
		setEditingUser(userItem);
		setSelectedRole(userItem.role as "ADMIN" | "MANAGER" | "VIEWER");
		setSelectedStatus(userItem.status);
		setSelectedAreaIds(
			userItem.areas
				.filter((a) => a.status === "approved")
				.map((a) => a.areaId),
		);
		setEditModalOpen(true);
	};

	const handleUpdateUserSubmit = () => {
		if (!editingUser) return;
		updateRoleAreasMutation.mutate({
			userId: editingUser.id,
			role: selectedRole,
			status: selectedStatus,
			areaIds: selectedAreaIds,
		});
	};

	const handleCreateArea = (e: FormEvent) => {
		e.preventDefault();
		if (!newAreaId.trim() || !newAreaName.trim()) {
			toast.danger("請填寫完整地區 ID 與名稱");
			return;
		}
		createAreaMutation.mutate({
			id: newAreaId.trim(),
			name: newAreaName.trim(),
		});
	};

	const handleDeleteArea = (id: string, name: string) => {
		if (
			window.confirm(
				`確定要刪除「${name} (${id})」地區嗎？將一併移除所有使用者與該地區的連結。`,
			)
		) {
			deleteAreaMutation.mutate({ id });
		}
	};

	const filteredUsers = useMemo(() => {
		if (!users) return [];
		const search = userSearch.toLowerCase().trim();
		if (!search) return users as UserItem[];

		return (users as UserItem[]).filter((u) => {
			const nameMatch = u.name?.toLowerCase().includes(search);
			const emailMatch = u.email?.toLowerCase().includes(search);
			const roleMatch = u.role?.toLowerCase().includes(search);
			const areaMatch = u.areas?.some((ua) =>
				ua.area?.name?.toLowerCase().includes(search),
			);
			return nameMatch || emailMatch || roleMatch || areaMatch;
		});
	}, [users, userSearch]);

	const toggleAreaSelection = (areaId: string) => {
		setSelectedAreaIds((prev) =>
			prev.includes(areaId)
				? prev.filter((id) => id !== areaId)
				: [...prev, areaId],
		);
	};

	return {
		activeTab,
		setActiveTab,
		isSuperAdmin,
		loadingApprovals,
		pendingApprovals: pendingApprovals as PendingApprovalItem[] | undefined,
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
	};
}
