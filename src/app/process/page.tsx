"use client";
import {
	Breadcrumbs,
	Button,
	Card,
	Chip,
	Label,
	ListBox,
	Modal,
	SearchField,
	Select,
	Skeleton,
	Spinner,
	Surface,
} from "@heroui/react";
import {
	Calendar,
	Info,
	Layers,
	RefreshCcw,
	Search,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

export default function ProcessPage() {
	const utils = api.useUtils();
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [selectedFilters, setSelectedFilters] = useState<
		Record<string, string[]>
	>({});

	const { data: syncedData, isLoading: isQueryLoading } =
		api.googleSheet.getAll.useQuery({
			search: debouncedSearch,
			filters: selectedFilters,
		});

	const { data: config } = api.googleSheet.getColumns.useQuery();

	const syncMutation = api.googleSheet.sync.useMutation({
		onSuccess: (data) => {
			void utils.googleSheet.getAll.invalidate();
			void utils.googleSheet.getColumns.invalidate();
			console.log(`Synced ${data.rowCount} rows and ${data.colCount} columns`);
		},
	});

	// Handle search debounce
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(search);
		}, 300);
		return () => clearTimeout(handler);
	}, [search]);

	const handleSync = () => {
		syncMutation.mutate();
	};

	const filterableColumns = config?.filter((c) => c.isFilterable) ?? [];

	return (
		<main className="container mx-auto flex flex-col gap-6 p-4 md:p-8">
			<Breadcrumbs>
				<Breadcrumbs.Item>
					<Link className="link hover:underline" href="/">
						Home
					</Link>
				</Breadcrumbs.Item>
				<Breadcrumbs.Item>Process</Breadcrumbs.Item>
			</Breadcrumbs>

			<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Data Processing</h1>
					<p className="text-muted-foreground">
						Manage and synchronize data from Google Sheets.
					</p>
				</div>
				<Button
					className="font-medium shadow-sm"
					isPending={syncMutation.isPending}
					onPress={handleSync}
					variant="primary"
				>
					{({ isPending }) => (
						<div className="flex items-center gap-2">
							<RefreshCcw
								className={`size-4 ${isPending ? "animate-spin" : ""}`}
							/>
							{isPending ? "Syncing..." : "Sync from Google Sheet"}
						</div>
					)}
				</Button>
			</div>

			<div className="flex flex-wrap items-center gap-4">
				<SearchField
					className="w-full sm:max-w-[300px]"
					onChange={setSearch}
					value={search}
					variant="secondary"
				>
					<SearchField.Group>
						<SearchField.SearchIcon>
							<Search className="size-4 text-muted-foreground" />
						</SearchField.SearchIcon>
						<SearchField.Input placeholder="Search all data..." />
						<SearchField.ClearButton />
					</SearchField.Group>
				</SearchField>

				{filterableColumns.map((col) => (
					<FilterSelect
						columnName={col.columnName}
						key={col.columnName}
						onSelectionChange={(values) => {
							setSelectedFilters((prev) => ({
								...prev,
								[col.columnName]: values,
							}));
						}}
						selectedKeys={selectedFilters[col.columnName] ?? []}
					/>
				))}
			</div>

			<Card className="border-none bg-content1 shadow-md">
				{isQueryLoading ? (
					<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{Array.from({ length: 8 }).map((_, i) => (
							<Card
								className="h-[200px] gap-3"
								// biome-ignore lint/suspicious/noArrayIndexKey: skeletons are static
								key={`skeleton-card-${i}`}
							>
								<Card.Header className="flex flex-col gap-2">
									<Skeleton className="h-6 w-3/4 rounded-lg" />
									<Skeleton className="h-4 w-1/2 rounded-lg" />
								</Card.Header>
								<Card.Content className="flex flex-col gap-2">
									<Skeleton className="h-3 w-full rounded-lg" />
									<Skeleton className="h-3 w-5/6 rounded-lg" />
								</Card.Content>
								<Card.Footer className="mt-auto">
									<Skeleton className="h-10 w-full rounded-lg" />
								</Card.Footer>
							</Card>
						))}
					</div>
				) : syncedData && syncedData.length > 0 ? (
					<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{syncedData.map((row) => (
							<ProcessCard key={row.id} row={row} />
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center gap-4 p-20 text-center">
						<div className="rounded-full bg-default-100 p-4">
							<Spinner className="opacity-50" color="current" size="sm" />
						</div>
						<div className="space-y-1">
							<p className="font-semibold text-xl">No Data Synced</p>
							<p className="mx-auto max-w-xs text-muted-foreground">
								Your local database is currently empty. Start by syncing from
								Google Sheets.
							</p>
						</div>
						<Button
							isPending={syncMutation.isPending}
							onPress={handleSync}
							variant="tertiary"
						>
							{({ isPending }) => (
								<>
									{isPending && <Spinner color="current" size="sm" />}
									Start First Sync
								</>
							)}
						</Button>
					</div>
				)}
			</Card>
		</main>
	);
}

function ProcessCard({
	row,
}: {
	row: { id: number; data: unknown; isAlwaysShow: boolean };
}) {
	const data = (row.data as Record<string, string>) ?? {};
	const title = data.主題 ?? "Untitled";
	const footerField = "負責人";

	return (
		<Card
			className="group h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
			variant="secondary"
		>
			<Card.Header>
				<Card.Title className="line-clamp-2 font-bold text-lg transition-colors group-hover:text-primary">
					{title}
				</Card.Title>
				<div className="card__description mt-4 flex flex-col gap-2.5 text-sm">
					<div className="flex items-center gap-2">
						<Calendar className="size-4 text-primary" />
						<div className="flex flex-col">
							<span className="font-medium text-[10px] text-muted-foreground uppercase">
								Time
							</span>
							<span className="font-semibold text-foreground">
								{data.StartAt ?? "-"} — {data.EndAt ?? "-"}
							</span>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Layers className="size-4 text-primary" />
						<div className="flex flex-col">
							<span className="font-medium text-[10px] text-muted-foreground uppercase">
								Group
							</span>
							<div className="mt-0.5 flex flex-wrap gap-1">
								{(data.組別 ?? "-").split(/[,\n\r]+/).map((g) => (
									<Chip color="accent" key={g.trim()} size="sm" variant="soft">
										{g.trim()}
									</Chip>
								))}
							</div>
						</div>
					</div>
				</div>
			</Card.Header>
			<Card.Footer className="mt-auto flex items-center justify-between gap-2 border-divider border-t pt-4">
				<div className="flex items-center gap-2">
					<div className="rounded-full bg-primary/10 p-2">
						<Users className="size-4 text-primary" />
					</div>
					<div className="flex flex-col">
						<span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
							{footerField}
						</span>
						<span className="font-bold text-sm">
							{data[footerField] ?? "-"}
						</span>
					</div>
				</div>

				<Modal>
					<Button className="font-semibold" size="sm" variant="tertiary">
						<Info className="size-3.5" />
						Details
					</Button>
					<Modal.Backdrop>
						<Modal.Container>
							<Modal.Dialog className="sm:max-w-[500px]">
								<Modal.CloseTrigger />
								<Modal.Header className="flex flex-col gap-1">
									<Modal.Heading className="font-bold text-2xl">
										{title}
									</Modal.Heading>
									<p className="text-muted-foreground text-sm">
										Full activity details and metadata
									</p>
								</Modal.Header>
								<Modal.Body>
									<Surface
										className="grid gap-6 rounded-2xl p-4"
										variant="secondary"
									>
										{Object.keys(data)
											.filter(
												(col) =>
													![
														"主題",
														"StartAt",
														"EndAt",
														"組別",
														"負責人",
													].includes(col),
											)
											.map((col) => (
												<div className="flex flex-col gap-1.5" key={col}>
													<div className="flex items-center gap-2">
														<div className="h-1.5 w-1.5 rounded-full bg-primary" />
														<span className="font-bold text-[11px] text-muted-foreground uppercase tracking-wider">
															{col}
														</span>
													</div>
													<div className="ml-0.5 whitespace-pre-wrap border-divider border-l-2 pl-3.5 text-sm leading-relaxed">
														{data[col] ?? "-"}
													</div>
												</div>
											))}
									</Surface>
								</Modal.Body>
								<Modal.Footer>
									<Button className="w-full" slot="close">
										Close
									</Button>
								</Modal.Footer>
							</Modal.Dialog>
						</Modal.Container>
					</Modal.Backdrop>
				</Modal>
			</Card.Footer>
		</Card>
	);
}

function FilterSelect({
	columnName,
	selectedKeys,
	onSelectionChange,
}: {
	columnName: string;
	selectedKeys: string[];
	onSelectionChange: (keys: string[]) => void;
}) {
	const { data: values } = api.googleSheet.getUniqueValues.useQuery({
		columnName,
	});

	if (!values || values.length === 0) return null;

	return (
		<Select
			className="w-full sm:max-w-[200px]"
			onChange={(val) => {
				if (Array.isArray(val)) {
					onSelectionChange(val.map((v) => String(v)));
				}
			}}
			placeholder={`Filter by ${columnName}`}
			selectionMode="multiple"
			value={selectedKeys}
			variant="primary"
		>
			<Label>{columnName}</Label>
			<Select.Trigger>
				<Select.Value>
					{({ isPlaceholder, state }) => {
						if (isPlaceholder || state.selectedItems.length === 0) {
							return `Filter by ${columnName}`;
						}

						return (
							<div className="flex flex-wrap gap-1">
								{state.selectedItems.map((item) => (
									<Chip
										className="font-medium"
										key={item.key}
										size="sm"
										variant="soft"
									>
										{item.textValue}
									</Chip>
								))}
							</div>
						);
					}}
				</Select.Value>
				<Select.Indicator />
			</Select.Trigger>
			<Select.Popover>
				<ListBox selectionMode="multiple">
					{values.map((val) => (
						<ListBox.Item id={val} key={val} textValue={val}>
							<div className="whitespace-pre-wrap">{val}</div>
							<ListBox.ItemIndicator />
						</ListBox.Item>
					))}
				</ListBox>
			</Select.Popover>
		</Select>
	);
}
