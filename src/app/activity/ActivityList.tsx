"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";
import { ActivityCard } from "./ActivityCard";
import { ActivityFormModal } from "./ActivityFormModal";

type Activity = {
	id: string;
	name: string;
	date: string;
	memo: string | null;
	googleSheetId: string | null;
	googleSheetName: string | null;
	handlingMode: string | null;
};

export function ActivityList() {
	const router = useRouter();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);

	const { data: activities, isLoading } = api.activity.getAll.useQuery();
	const utils = api.useUtils();
	const deleteMutation = api.activity.delete.useMutation({
		onSuccess: async () => {
			await utils.activity.getAll.invalidate();
		},
	});

	const handleEdit = (activity: Activity) => {
		setActivityToEdit(activity);
		setIsModalOpen(true);
	};

	const handleCreate = () => {
		setActivityToEdit(null);
		setIsModalOpen(true);
	};

	const handleDelete = (id: string) => {
		if (confirm("Are you sure you want to delete this activity?")) {
			deleteMutation.mutate({ id });
		}
	};

	const handleNavigate = (activity: Activity) => {
		if (activity.handlingMode === "process") {
			router.push(`/process/${activity.id}`);
		} else {
			router.push(`/simple-display/${activity.id}`);
		}
	};

	if (isLoading) {
		return <div className="text-white">Loading activities...</div>;
	}

	return (
		<div className="w-full max-w-4xl space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="font-bold text-2xl">Your Activities</h2>
				<Button
					className="bg-primary text-primary-foreground"
					onPress={handleCreate}
					variant="primary"
				>
					Create Activity
				</Button>
			</div>

			{!activities || activities.length === 0 ? (
				<div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
					<p>You have no activities yet.</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{activities.map((activity) => (
						<ActivityCard
							activity={activity}
							key={activity.id}
							onDelete={() => handleDelete(activity.id)}
							onEdit={() => handleEdit(activity)}
							onNavigate={() => handleNavigate(activity)}
						/>
					))}
				</div>
			)}

			<ActivityFormModal
				activityToEdit={activityToEdit}
				isOpen={isModalOpen}
				onOpenChange={setIsModalOpen}
			/>
		</div>
	);
}
