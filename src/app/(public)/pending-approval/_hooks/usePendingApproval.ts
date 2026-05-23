import { toast } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import type { Area, UserArea } from "~/server/db/schema";
import { api } from "~/trpc/react";

export type AreaStatusItem = UserArea & {
	area: Pick<Area, "id" | "name">;
};

export interface UsePendingApprovalProps {
	userId: string;
}

export function usePendingApproval({ userId }: UsePendingApprovalProps) {
	const utils = api.useUtils();

	// Fetch public list of areas
	const { data: publicAreas, isLoading: isAreasLoading } =
		api.user.getPublicAreas.useQuery();

	// Fetch current user's application statuses
	const { data: myApplications, isLoading: isAppsLoading } =
		api.user.getMyAreaStatuses.useQuery(undefined, {
			enabled: !!userId,
		});

	const applyMutation = api.user.applyToAreas.useMutation({
		onSuccess: () => {
			toast.success("申請已成功送出，請靜候管理員審核！");
			setIsApplyingMore(false);
			void utils.user.getMyAreaStatuses.invalidate();
		},
		onError: (err) => {
			toast.danger(`申請失敗: ${err.message}`);
		},
	});

	const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
	const [isApplyingMore, setIsApplyingMore] = useState(false);

	// Sync applied areas to selectedAreaIds on load
	useEffect(() => {
		if (myApplications) {
			setSelectedAreaIds(myApplications.map((app) => app.areaId));
		}
	}, [myApplications]);

	const availableToApply = useMemo(() => {
		return publicAreas ?? [];
	}, [publicAreas]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (selectedAreaIds.length === 0) {
			toast.danger("請至少選擇一個營運分會！");
			return;
		}
		applyMutation.mutate({
			areaIds: selectedAreaIds,
		});
	};

	const hasApplications = !!(
		myApplications && (myApplications as AreaStatusItem[]).length > 0
	);
	const showOnboardingForm = !hasApplications || isApplyingMore;

	const refetchStatus = async () => {
		await utils.user.getMyAreaStatuses.invalidate();
	};

	return {
		isLoading: isAreasLoading || isAppsLoading,
		myApplications: myApplications as AreaStatusItem[] | undefined,
		availableToApply,
		selectedAreaIds,
		setSelectedAreaIds,
		isApplyingMore,
		setIsApplyingMore,
		applyMutation,
		hasApplications,
		showOnboardingForm,
		handleSubmit,
		refetchStatus,
	};
}
