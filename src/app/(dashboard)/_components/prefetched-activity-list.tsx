import { api, HydrateClient } from "~/trpc/server";
import { ActivityList } from "./activity-list";

export async function PrefetchedActivityList() {
	await api.activity.getAll.prefetch();

	return (
		<HydrateClient>
			<ActivityList />
		</HydrateClient>
	);
}
