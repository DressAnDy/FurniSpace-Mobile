import React, { useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { filterIconDefinition, moreHorizontalIconDefinition } from "../../../icons/action/definitions";
import { logoutIconDefinition, lockIconDefinition, shieldIconDefinition } from "../../../icons/auth/definitions";
import { bellIconDefinition, chatIconDefinition } from "../../../icons/communication/definitions";
import { helpIconDefinition } from "../../../icons/common/definitions";
import { fileTextIconDefinition } from "../../../icons/file/definitions";
import { chevronRightIconDefinition, searchIconDefinition, settingsIconDefinition } from "../../../icons/navigation/definitions";
import { calendarIconDefinition, projectIconDefinition } from "../../../icons/project/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import type { IconDefinition } from "../../../icons/types";
import { useLogoutAction } from "../../auth/hooks/useAuthActions";
import { useAuthStore } from "../../auth/store/auth.store";
import { overviewMetrics, saleConversations, saleProjects, saleRequests, type SaleProject, type SaleRequest } from "../data/sale.mock";
import { Avatar, FilterChips, SaleBottomNav, SaleFrame, SaleHeader, SectionTitle } from "../components/SaleShared";
import { SALE, saleStyles as s } from "../styles/sale.styles";

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }): React.JSX.Element {
  return (
    <View style={s.search}>
      <AppIcon definition={searchIconDefinition} size={15} color="rgba(255,255,255,.55)" />
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="rgba(255,255,255,.4)" style={s.searchInput} />
    </View>
  );
}

export function SaleDashboardScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const alerts = [
    ["Designer Not Assigned", "Start fee already received", "PRJ-2026-014", "#FB2C36", "Urgent"],
    ["Quotation Expiring", "Valid until Aug 25", "PRJ-2026-008", "#FF6900", "High"],
    ["Production Delayed", "Deposit confirmed 2d ago", "PRJ-2026-011", "#FFB900", "High"],
    ["Overdue Schedule", "Customer visit missed by 2 days", "PRJ-2026-012", "#51A2FF", "Medium"],
  ];
  return (
    <SaleFrame>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SaleHeader title="Sales Dashboard" subtitle="Mon 24 Aug · Updated 2m ago">
          <View style={[s.headerActions, { position: "absolute", right: 19, bottom: 20 }]}>
            <View style={s.headerIcon}><AppIcon definition={bellIconDefinition} size={15} color={SALE.white} /></View>
            <View style={s.avatarGold}><Text style={s.avatarText}>VN</Text></View>
          </View>
        </SaleHeader>

        <View style={{ paddingTop: 15 }}>
          <View style={{ paddingHorizontal: 19 }}><SectionTitle title="Action Alerts" action="5 requiring action" /></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.alertScroller}>
            {alerts.map(([title, description, code, color, priority]) => (
              <Pressable key={code} style={[s.alertCard, { borderColor: color }]} onPress={() => navigation.navigate("SaleProjectDetail", { tab: "Overview" })}>
                <View style={s.alertTop}>
                  <View style={[s.alertIcon, { backgroundColor: `${color}22` }]}><AppIcon definition={bellIconDefinition} size={14} color={color} /></View>
                  <View style={[s.priorityBadge, { backgroundColor: color }]}><Text style={s.priorityText}>{priority}</Text></View>
                </View>
                <Text style={s.alertTitle}>{title}</Text>
                <Text style={s.alertDescription}>{description}</Text>
                <Text style={[s.cardMeta, { marginTop: 8 }]}>{code}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={[s.content, s.contentGap, { paddingTop: 16 }]}>
          <View>
            <SectionTitle title="Overview" />
            <View style={s.metricGrid}>
              {overviewMetrics.map(([value, label, color, delta]) => (
                <View style={s.metric} key={label}>
                  <View style={s.metricRow}><Text style={[s.metricValue, { color }]}>{value}</Text><Text style={s.metricDelta}>{delta}</Text></View>
                  <Text style={s.metricLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
          <View>
            <SectionTitle title="Action Queue" action="View All" onAction={() => navigation.navigate("SaleProjects")} />
            <FilterChips options={["Intake  3", "Proposal  2", "Payment  2", "Delivery  1"]} selected="Intake  3" onSelect={() => undefined} />
            <View style={s.card}>
              <View style={s.topCardRow}>
                <View><Text style={s.cardTitle}>Garden Villa Interior</Text><Text style={s.cardMeta}>PRJ-2026-017</Text></View>
                <View style={[s.priorityBadge, { backgroundColor: SALE.red }]}><Text style={s.priorityText}>Urgent</Text></View>
              </View>
              <Text style={[s.infoLabel, { marginTop: 12 }]}>NEXT ACTION</Text>
              <Text style={s.infoValue}>Review request and assign consultation owner</Text>
              <Pressable style={[s.buttonPrimary, { marginTop: 12 }]} onPress={() => navigation.navigate("SaleRequests")}><Text style={s.buttonPrimaryText}>Open Request</Text></Pressable>
            </View>
          </View>
          <View>
            <SectionTitle title="Project Pipeline" />
            <View style={s.pipeline}>
              {[["Consultation", 72, "7"], ["Design", 54, "5"], ["Quotation", 41, "4"], ["Production", 63, "6"], ["Delivery", 26, "2"]].map(([label, width, count]) => (
                <View style={s.pipelineRow} key={label as string}>
                  <Text style={s.pipelineLabel}>{label}</Text>
                  <View style={s.pipelineTrack}><View style={[s.pipelineFill, { width: `${Number(width)}%` as `${number}%` }]} /></View>
                  <Text style={s.pipelineCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
          <View>
            <SectionTitle title="Commercial Overview" />
            <View style={[s.card, s.commercial]}>
              <View><Text style={s.commercialValue}>₫ 2.4B</Text><Text style={s.commercialLabel}>Open pipeline</Text></View>
              <View style={s.dividerVertical} />
              <View><Text style={s.commercialValue}>₫ 680M</Text><Text style={s.commercialLabel}>Won this month</Text></View>
            </View>
          </View>
        </View>
      </ScrollView>
      <SaleBottomNav active="dashboard" />
    </SaleFrame>
  );
}

export function SaleRequestsScreen(): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const items = useMemo(() => saleRequests.filter((item) => `${item.name} ${item.customer}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return (
    <SaleFrame>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SaleHeader title="Project Requests">
          <View style={s.searchRow}><SearchBar value={query} onChange={setQuery} placeholder="Search by name or customer…" /><View style={s.filterButton}><AppIcon definition={filterIconDefinition} size={15} color={SALE.white} /></View></View>
        </SaleHeader>
        <FilterChips options={["All", "New", "In Review", "Waiting Info"]} selected={filter} onSelect={setFilter} />
        <View style={[s.content, s.contentGap]}>
          <Text style={s.sectionLabel}>{items.length} requests</Text>
          {items.map((item) => <RequestCard key={item.id} item={item} />)}
        </View>
      </ScrollView>
      <SaleBottomNav active="requests" />
    </SaleFrame>
  );
}

function RequestCard({ item }: { item: SaleRequest }): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = { urgent: SALE.red, high: "#FF8904", medium: "#FFB900" };
  return (
    <View style={s.card}>
      <View style={s.topCardRow}>
        <View style={{ flexDirection: "row", flex: 1 }}><View style={[s.priorityDot, { backgroundColor: colors[item.priority] }]} /><View><Text style={s.cardTitle}>{item.name}</Text><Text style={s.cardMeta}>{item.id}</Text></View></View>
        <View style={s.status}><Text style={s.statusText}>{item.status}</Text></View>
      </View>
      <View style={s.infoGrid}>
        {[["Customer", item.customer], ["Type", item.type], ["Area", item.area], ["Budget", item.budget], ["Submitted", item.submitted]].map(([label, value]) => <InfoCell key={label} label={label} value={value} />)}
      </View>
      <View style={s.buttonRow}>
        <Pressable style={s.buttonSecondary} onPress={() => navigation.navigate("SaleProjectDetail", { tab: "Overview" })}><Text style={s.buttonSecondaryText}>View Details</Text></Pressable>
        <Pressable style={s.buttonPrimary}><Text style={s.buttonPrimaryText}>Accept  →</Text></Pressable>
      </View>
    </View>
  );
}

export function SaleProjectsScreen(): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const items = saleProjects.filter((item) => `${item.name} ${item.customer}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <SaleFrame>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SaleHeader title="Assigned Projects">
          <View style={s.searchRow}><SearchBar value={query} onChange={setQuery} placeholder="Search project or customer…" /><View style={s.filterButton}><AppIcon definition={filterIconDefinition} size={15} color={SALE.white} /></View></View>
        </SaleHeader>
        <FilterChips options={["All", "Active", "Production", "Delivery"]} selected={filter} onSelect={setFilter} />
        <View style={[s.content, s.contentGap]}>
          <Text style={s.sectionLabel}>{items.length} projects</Text>
          {items.map((item) => <ProjectCard key={item.id} item={item} />)}
        </View>
      </ScrollView>
      <SaleBottomNav active="projects" />
    </SaleFrame>
  );
}

function ProjectCard({ item }: { item: SaleProject }): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View style={s.card}>
      <View style={s.topCardRow}>
        <View><Text style={s.cardTitle}>{item.name}</Text><Text style={s.cardMeta}>{item.id} · {item.type}</Text></View>
        <View style={s.status}><Text style={[s.statusText, { color: item.color }]}>{item.status}</Text></View>
      </View>
      <View style={s.infoGrid}>
        <InfoCell label="Customer" value={item.customer} /><InfoCell label="Designer" value={item.designer} />
        <InfoCell label="Target Date" value={item.target} /><InfoCell label="Next Action" value={item.nextAction} color={item.color} />
      </View>
      <Pressable style={[s.buttonSecondary, { marginTop: 12 }]} onPress={() => navigation.navigate("SaleProjectDetail", { tab: "Overview" })}><Text style={[s.buttonSecondaryText, { color: SALE.ink }]}>View Project  →</Text></Pressable>
    </View>
  );
}

function InfoCell({ label, value, color }: { label: string; value: string; color?: string }): React.JSX.Element {
  return <View style={s.infoCell}><Text style={s.infoLabel}>{label}</Text><Text style={[s.infoValue, color ? { color, fontWeight: "600" } : null]}>{value}</Text></View>;
}

export function SaleMessagesScreen(): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const conversations = saleConversations.filter((item) => `${item.name} ${item.meta}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <SaleFrame>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SaleHeader title="Messages">
          <View style={{ position: "absolute", right: 19, bottom: 68 }}><View style={s.headerIcon}><AppIcon definition={moreHorizontalIconDefinition} size={15} color={SALE.white} /></View></View>
          <View style={s.searchRow}><SearchBar value={query} onChange={setQuery} placeholder="Search conversations…" /></View>
        </SaleHeader>
        <FilterChips options={["All", "Customers", "Designers", "Internal"]} selected={filter} onSelect={setFilter} />
        <View style={[s.content, s.contentGap]}>
          <Text style={s.sectionLabel}>{conversations.length} conversations</Text>
          {conversations.map((item) => (
            <Pressable key={item.id} style={s.conversation} onPress={() => navigation.navigate("SaleChat", { conversationId: item.id })}>
              <View><Avatar initials={item.initials} color={item.color} size={42} />{item.online ? <View style={s.online} /> : null}</View>
              <View style={s.conversationBody}>
                <View style={s.conversationTop}><View><Text style={s.conversationName}>{item.name}</Text><Text style={s.conversationMeta}>{item.meta}</Text></View><View><Text style={s.conversationTime}>{item.time}</Text>{item.unread ? <View style={s.unread}><Text style={s.badgeText}>{item.unread}</Text></View> : null}</View></View>
                <Text style={s.conversationPreview} numberOfLines={1}>{item.preview}</Text>
              </View>
            </Pressable>
          ))}
          <Text style={s.centerMuted}>All conversations shown</Text>
        </View>
      </ScrollView>
      <SaleBottomNav active="messages" />
    </SaleFrame>
  );
}

export function SaleMoreScreen(): React.JSX.Element {
  const currentUser = useAuthStore((state) => state.user);
  const logout = useLogoutAction();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const menu: { icon: IconDefinition; title: string; subtitle: string; action?: () => void }[] = [
    { icon: bellIconDefinition, title: "Notification Settings", subtitle: "Manage alerts and reminders" },
    { icon: lockIconDefinition, title: "Change Password", subtitle: "Update your account password", action: () => navigation.navigate("ChangePassword") },
    { icon: fileTextIconDefinition, title: "Sales Documents", subtitle: "Proposals, quotations & contracts" },
    { icon: projectIconDefinition, title: "Project Preferences", subtitle: "Defaults and assignment options" },
    { icon: shieldIconDefinition, title: "Privacy & Security", subtitle: "Access and account protection" },
    { icon: helpIconDefinition, title: "Help & Support", subtitle: "Contact the FurniSpace team" },
  ];
  return (
    <SaleFrame>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.profileHero}>
          <SaleHeader title="More & Settings" />
          <View style={s.profileRow}>
            <View style={s.profileAvatar}><Text style={[s.avatarText, { fontSize: 16 }]}>VN</Text></View>
            <View><Text style={s.profileName}>{currentUser?.fullName ?? "Viet Nguyen"}</Text><Text style={s.profileRole}>Sales Manager · FurniSpace</Text></View>
          </View>
        </View>
        <View style={[s.content, s.contentGap, { paddingTop: 15 }]}>
          <View style={s.card}>
            <SectionTitle title="Account & Preferences" />
            {menu.map((item) => (
              <Pressable key={item.title} style={s.settingRow} onPress={item.action}>
                <View style={s.settingIcon}><AppIcon definition={item.icon} size={15} color={SALE.muted} /></View>
                <View style={s.settingCopy}><Text style={s.settingTitle}>{item.title}</Text><Text style={s.settingSubtitle}>{item.subtitle}</Text></View>
                <AppIcon definition={chevronRightIconDefinition} size={15} color={SALE.muted} />
              </Pressable>
            ))}
          </View>
          <View style={s.card}>
            <SectionTitle title="Sales Workspace" />
            <View style={s.infoGrid}><InfoCell label="Assigned projects" value="23" /><InfoCell label="Open requests" value="7" /><InfoCell label="Unread messages" value="4" /><InfoCell label="Schedules today" value="3" /></View>
          </View>
          <Pressable style={s.signOut} disabled={logout.isPending} onPress={() => logout.mutate(undefined, { onSettled: () => navigation.reset({ index: 0, routes: [{ name: "Login" }] }) })}>
            <View style={[s.settingIcon, { backgroundColor: "#FFE2E2" }]}><AppIcon definition={logoutIconDefinition} size={15} color={SALE.red} /></View>
            <View style={s.settingCopy}><Text style={s.signOutTitle}>{logout.isPending ? "Signing Out…" : "Sign Out"}</Text><Text style={s.settingSubtitle}>{currentUser?.email ?? "viet.nguyen@furnispace.vn"}</Text></View>
          </Pressable>
          <Text style={s.centerMuted}>FURNISPACE SALES v1.0.0 · © 2026</Text>
        </View>
      </ScrollView>
      <SaleBottomNav active="more" />
    </SaleFrame>
  );
}
