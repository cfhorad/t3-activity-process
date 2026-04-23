"use client";
import {
	Breadcrumbs,
	Button,
	Card,
	Input,
	// type Key,
	Label,
	ListBox,
	Select,
	Spinner,
	Table,
} from "@heroui/react";
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

	const displayColumns = config?.map((c) => c.columnName) ?? [];
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
					className="font-medium"
					isPending={syncMutation.isPending}
					onPress={handleSync}
					variant="primary"
				>
					{({ isPending }) => (
						<>
							{isPending && <Spinner color="current" size="sm" />}
							Sync from Google Sheet
						</>
					)}
				</Button>
			</div>

			<div className="flex flex-wrap items-center gap-4">
				<Input
					className="w-full sm:max-w-[300px]"
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search all data..."
					value={search}
					variant="primary"
				/>

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
					<div className="flex flex-col items-center justify-center gap-4 p-16">
						<Spinner color="accent" size="lg" />
						<p className="text-muted-foreground text-sm">
							Loading local database...
						</p>
					</div>
				) : syncedData && syncedData.length > 0 ? (
					<div className="p-1">
						<Table variant="secondary">
							<Table.ScrollContainer>
								<Table.Content
									aria-label="Google Sheet Data"
									selectionMode="none"
								>
									<Table.Header>
										{displayColumns.map((col) => (
											<Table.Column
												id={col}
												isRowHeader={col === displayColumns[0]}
												key={col}
											>
												<div className="whitespace-pre-wrap">{col}</div>
											</Table.Column>
										))}
									</Table.Header>
									<Table.Body items={syncedData}>
										{(row) => (
											<Table.Row id={row.id} key={row.id}>
												{displayColumns.map((col) => (
													<Table.Cell key={`${row.id}-${col}`}>
														<div className="whitespace-pre-wrap py-1 leading-relaxed">
															{String(
																(row.data as Record<string, unknown>)[col] ??
																	"-",
															)}
														</div>
													</Table.Cell>
												))}
											</Table.Row>
										)}
									</Table.Body>
								</Table.Content>
							</Table.ScrollContainer>
						</Table>
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
			onChange={(value) => {
				onSelectionChange((value as string[]) || []);
			}}
			placeholder={`Filter by ${columnName}`}
			selectionMode="multiple"
			value={selectedKeys}
			variant="primary"
		>
			<Label>{columnName}</Label>
			<Select.Trigger>
				<Select.Value />
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
