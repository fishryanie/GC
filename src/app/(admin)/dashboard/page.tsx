import { Button, Card, Col, Row, Space, Statistic } from "antd";
import { getTranslations } from "next-intl/server";
import { FlashAlert } from "@/app/components/flash-alert";
import { seedInitialDataAction } from "@/app/(admin)/dashboard/actions";
import { requireAuthSession } from "@/lib/auth";
import { getDashboardStats, listOrders } from "@/lib/data";
import { formatCurrency, formatDate, formatKg } from "@/lib/format";
import { getFlashMessage } from "@/lib/flash";
import { resolveSearchParams } from "@/lib/search-params";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await resolveSearchParams(searchParams);
  const flash = getFlashMessage(params);
  const [tDashboard, tStatuses] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("statuses"),
  ]);
  const session = await requireAuthSession();
  const canViewCost = session.seller.role === "ADMIN";

  const [stats, recentOrders] = await Promise.all([
    getDashboardStats(),
    listOrders({ limit: 6 }),
  ]);

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <Card className="rounded-xl border border-border bg-background-secondary">
        <p className="m-0 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-foreground-muted">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-background-tertiary text-[13px]"
            aria-hidden
          >
            📊
          </span>
          Dashboard
        </p>
        <h2 className="mb-1 mt-2 text-3xl font-bold leading-tight text-foreground">
          {tDashboard("title")}
        </h2>
        <p className="m-0 text-foreground-secondary">
          {tDashboard("subtitle")}
        </p>
      </Card>

      {flash ? <FlashAlert type={flash.type} message={flash.message} /> : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card className="border border-border bg-background-secondary">
            <Statistic title={tDashboard("totalRevenue")} value={formatCurrency(stats.totalRevenue)} />
            {canViewCost ? (
              <p className="m-0 text-xs text-foreground-muted">
                {tDashboard("profit", { amount: formatCurrency(stats.totalProfit) })}
              </p>
            ) : null}
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="border border-border bg-background-secondary">
            <Statistic title={tDashboard("activeOrders")} value={stats.deliveringOrders} />
            <p className="m-0 text-xs text-foreground-muted">
              {tDashboard("totalOrders", { count: stats.totalOrders })}
            </p>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="border border-border bg-background-secondary">
            <Statistic title={tDashboard("activeProducts")} value={stats.activeProducts} />
            <p className="m-0 text-xs text-foreground-muted">
              {tDashboard("totalProducts", { count: stats.totalProducts })}
            </p>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="border border-border bg-background-secondary">
            <Statistic title={tDashboard("ordersNotCollected")} value={stats.uncollectedOrders} />
            <p className="m-0 text-xs text-foreground-muted">
              {tDashboard("supplierUnpaid", { count: stats.unpaidOrders })}
            </p>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card
            className="border border-border bg-background-secondary"
            title={tDashboard("latestOrders")}
            extra={
              <Button type="link" href="/orders" className="!px-0">
                {tDashboard("viewAll")}
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse">
                <thead>
                  <tr>
                    <th className="border-b border-border px-1.5 py-2 text-left">
                      {tDashboard("table.orderCode")}
                    </th>
                    <th className="border-b border-border px-1.5 py-2 text-left">
                      {tDashboard("table.buyer")}
                    </th>
                    <th className="border-b border-border px-1.5 py-2 text-left">
                      {tDashboard("table.deliveryDate")}
                    </th>
                    <th className="border-b border-border px-1.5 py-2 text-left">
                      {tDashboard("table.weight")}
                    </th>
                    <th className="border-b border-border px-1.5 py-2 text-left">
                      {tDashboard("table.bill")}
                    </th>
                    {canViewCost ? (
                      <th className="border-b border-border px-1.5 py-2 text-left">
                        {tDashboard("table.profit")}
                      </th>
                    ) : null}
                    <th className="border-b border-border px-1.5 py-2 text-left">
                      {tDashboard("table.status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="border-b border-border px-1.5 py-2">
                        <code className="text-xs">{order.code}</code>
                      </td>
                      <td className="border-b border-border px-1.5 py-2">{order.buyerName}</td>
                      <td className="border-b border-border px-1.5 py-2">{formatDate(order.deliveryDate)}</td>
                      <td className="border-b border-border px-1.5 py-2">{formatKg(order.totalWeightKg)}</td>
                      <td className="border-b border-border px-1.5 py-2">{formatCurrency(order.totalSaleAmount)}</td>
                      {canViewCost ? (
                        <td className="border-b border-border px-1.5 py-2 text-green-500">{formatCurrency(order.totalProfitAmount)}</td>
                      ) : null}
                      <td className="border-b border-border px-1.5 py-2 text-xs">
                        <div>{tStatuses(`fulfillment.${order.fulfillmentStatus}`)}</div>
                        <div className="text-foreground-muted">{tStatuses(`supplierPayment.${order.supplierPaymentStatus}`)}</div>
                        <div className="text-foreground-muted">{tStatuses(`collection.${order.collectionStatus}`)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Space orientation="vertical" size={16} style={{ width: "100%" }}>
            <Card className="border border-border bg-background-secondary" title={tDashboard("quickActions")}>
              <Space orientation="vertical" size={8} style={{ width: "100%" }}>
                <Button type="primary" href="/orders/new" block>
                  {tDashboard("createNewOrder")}
                </Button>
                <Button href="/price-profiles" block>
                  {tDashboard("createPriceProfile")}
                </Button>
              </Space>
            </Card>

            {canViewCost ? (
              <Card className="border border-border bg-background-secondary" title={tDashboard("seedData")}>
                <p className="text-foreground-secondary">
                  {tDashboard("seedDescription")}
                </p>
                <form action={seedInitialDataAction}>
                  <Button htmlType="submit" type="primary" block>
                    {tDashboard("seedButton")}
                  </Button>
                </form>
              </Card>
            ) : null}
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
