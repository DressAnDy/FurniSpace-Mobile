import React, { useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { plusIconDefinition } from "../../../icons/action/definitions";
import { mailIconDefinition, sendIconDefinition, paperclipIconDefinition } from "../../../icons/communication/definitions";
import { calendarIconDefinition, clockIconDefinition } from "../../../icons/project/definitions";
import { downloadIconDefinition, fileTextIconDefinition, imageIconDefinition, pdfIconDefinition, uploadIconDefinition } from "../../../icons/file/definitions";
import { phoneIconDefinition } from "../../../icons/communication/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import { saleConversations, type ProjectDetailTab } from "../data/sale.mock";
import { Avatar, DetailFixedActions, ProjectDetailHeader, ProjectTabs, SaleFrame } from "../components/SaleShared";
import { SALE, saleStyles as s } from "../styles/sale.styles";

type ProjectProps = NativeStackScreenProps<RootStackParamList, "SaleProjectDetail">;
type ChatProps = NativeStackScreenProps<RootStackParamList, "SaleChat">;

export function SaleProjectDetailScreen({ route }: ProjectProps): React.JSX.Element {
  const activeTab: ProjectDetailTab = route.params?.tab ?? "Overview";
  const [scheduleModal, setScheduleModal] = useState(route.params?.openScheduleModal ?? false);
  return (
    <SaleFrame>
      <ProjectDetailHeader />
      <ProjectTabs active={activeTab} />
      {activeTab === "Chat" ? (
        <ProjectChat />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, s.contentGap, { paddingTop: 15, paddingBottom: 105 }]}>
          {activeTab === "Overview" ? <OverviewTab /> : null}
          {activeTab === "Member" ? <MemberTab /> : null}
          {activeTab === "Files" ? <FilesTab /> : null}
          {activeTab === "Schedules" ? <SchedulesTab onCreate={() => setScheduleModal(true)} /> : null}
        </ScrollView>
      )}
      {activeTab !== "Chat" ? <DetailFixedActions /> : null}
      <CreateScheduleModal visible={scheduleModal} onClose={() => setScheduleModal(false)} />
    </SaleFrame>
  );
}

function OverviewTab(): React.JSX.Element {
  const requirements = ["Modern minimalist aesthetic with warm wood accents", "Open-plan living and dining area", "Maximize natural light through smart layout", "Built-in storage solutions throughout", "Smart home integration for lighting and AC"];
  const furniture = ["Modular sofa (4-seat) with chaise", "Dining table for 6 persons", "Full kitchen cabinet system", "Master bedroom walk-in wardrobe", "Home office desk and shelving unit"];
  return (
    <>
      <View style={s.alert}><View style={s.alertCopy}><Text style={s.alertHeading}>Action Required</Text><Text style={s.alertBody}>Start fee confirmed. Assign a designer to proceed to space measurement.</Text></View></View>
      <View style={s.card}><Text style={s.sectionLabel}>Project Brief</Text><Text style={[s.bodyText, { marginTop: 8 }]}>Full renovation of a 68 sqm apartment in Binh Thanh District. Client wants a modern minimalist style with warm wood tones, maximizing natural light. Open-plan living and dining space requested.</Text></View>
      <View style={s.card}>
        <Text style={s.sectionLabel}>Project Details</Text>
        <View style={s.infoGrid}>
          <Info label="Area" value="68 sqm" /><Info label="Budget" value="₫ 120,000,000" /><Info label="Submitted" value="Aug 18, 2026" /><Info label="Target Date" value="Sep 10, 2026" />
          <View style={{ width: "100%" }}><Text style={s.infoLabel}>Address</Text><Text style={s.infoValue}>45 Nguyen Huu Canh, Binh Thanh District, HCM City</Text></View>
        </View>
      </View>
      <RequirementCard title="Customer Requirements" items={requirements} bullets />
      <RequirementCard title="Furniture Requirements" items={furniture} />
    </>
  );
}

function RequirementCard({ title, items, bullets = false }: { title: string; items: string[]; bullets?: boolean }): React.JSX.Element {
  return <View style={s.card}><Text style={s.sectionLabel}>{title}</Text>{items.map((item, index) => <View style={s.bulletRow} key={item}>{bullets ? <View style={s.bullet} /> : <Text style={s.cardMeta}>{index + 1}.</Text>}<Text style={[s.bodyText, { flex: 1 }]}>{item}</Text></View>)}</View>;
}

function MemberTab(): React.JSX.Element {
  return (
    <>
      <View style={s.card}>
        <Text style={s.sectionLabel}>Customer</Text>
        <View style={s.memberRow}><Avatar initials="NA" color={SALE.charcoal} /><View style={s.memberCopy}><Text style={s.memberName}>Nguyen Minh Anh</Text><Text style={s.memberRole}>Personal</Text></View></View>
        <Contact icon="mail" value="minh.anh@gmail.com" /><Contact icon="phone" value="+84 901 234 567" />
      </View>
      <View style={s.card}>
        <Text style={s.sectionLabel}>Sales In Charge</Text>
        <View style={s.memberRow}><Avatar initials="VN" color={SALE.gold} /><View style={s.memberCopy}><Text style={s.memberName}>Viet Nguyen</Text><Text style={s.memberRole}>Sales Manager</Text></View><Text style={s.availability}>● Online</Text></View>
      </View>
      <View style={s.card}>
        <Text style={s.sectionLabel}>Designer Assignment</Text>
        <Text style={[s.infoLabel, { marginTop: 15 }]}>SPACE DATA STATUS</Text>
        <View style={[s.typeRow, { marginTop: 8 }]}>{["Not Available", "Basic Photos", "Floor Plan Ready"].map((item, index) => <View key={item} style={[s.typeOption, index === 2 && { borderColor: SALE.gold, backgroundColor: "rgba(201,168,106,.08)" }]}><Text style={[s.chipText, index === 2 && { color: SALE.gold }]}>{item}</Text></View>)}</View>
        <Text style={[s.infoLabel, { marginTop: 16 }]}>AVAILABLE DESIGNERS</Text>
        <Designer initials="LT" name="Linh Tran" role="Senior Designer" projects="4 projects" available />
        <Designer initials="KP" name="Khoa Pham" role="Mid Designer" projects="7 projects" />
        <Designer initials="AN" name="An Nguyen" role="Junior Designer" projects="2 projects" available />
        <Pressable style={[s.buttonSecondary, { marginTop: 15, height: 41 }]}><Text style={s.buttonSecondaryText}>Select a Designer</Text></Pressable>
      </View>
    </>
  );
}

function Contact({ icon, value }: { icon: "mail" | "phone"; value: string }): React.JSX.Element {
  return <View style={s.memberRow}><View style={s.settingIcon}><AppIcon definition={icon === "mail" ? mailIconDefinition : phoneIconDefinition} size={14} color={SALE.muted} /></View><Text style={s.infoValue}>{value}</Text></View>;
}

function Designer({ initials, name, role, projects, available = false }: { initials: string; name: string; role: string; projects: string; available?: boolean }): React.JSX.Element {
  return <View style={[s.memberRow, !available && { opacity: .5 }]}><Avatar initials={initials} color={initials === "LT" ? "#4A7A5A" : initials === "KP" ? "#7B5EA7" : "#3A6B9A"} size={34} /><View style={s.memberCopy}><Text style={s.memberName}>{name}</Text><Text style={s.memberRole}>{role}</Text></View><View><Text style={s.infoValue}>{projects}</Text><Text style={[s.availability, !available && { color: SALE.red }]}>{available ? "Available" : "At capacity"}</Text></View></View>;
}

function FilesTab(): React.JSX.Element {
  const sections = [
    { title: "Customer Uploads", files: [["Apartment floor plan.pdf", "PDF · 2.4 MB · Aug 18", "pdf"], ["Living room reference.jpg", "JPG · 1.8 MB · Aug 18", "image"], ["Kitchen measurements.docx", "DOCX · 540 KB · Aug 19", "text"]] },
    { title: "Sales Documents", files: [["Initial consultation notes.pdf", "PDF · 820 KB · Aug 20", "pdf"], ["Project brief v2.docx", "DOCX · 1.1 MB · Aug 21", "text"]] },
    { title: "Design References", files: [["Moodboard - warm minimal.jpg", "JPG · 3.2 MB · Aug 22", "image"], ["Material palette.pdf", "PDF · 4.7 MB · Aug 22", "pdf"]] },
  ];
  return (
    <>
      <View style={[s.card, s.dashed]}><AppIcon definition={uploadIconDefinition} size={20} color={SALE.gold} /><Text style={[s.cardTitle, { marginTop: 8 }]}>Upload project files</Text><Text style={s.centerMuted}>PDF, images or documents up to 20 MB</Text></View>
      {sections.map((section) => <View style={s.card} key={section.title}><Text style={s.sectionLabel}>{section.title}</Text>{section.files.map(([name, meta, type]) => <View style={s.fileRow} key={name}><View style={s.fileIcon}><AppIcon definition={type === "pdf" ? pdfIconDefinition : type === "image" ? imageIconDefinition : fileTextIconDefinition} size={17} color={SALE.muted} /></View><View style={s.fileCopy}><Text style={s.fileName}>{name}</Text><Text style={s.fileMeta}>{meta}</Text></View><AppIcon definition={downloadIconDefinition} size={15} color={SALE.muted} /></View>)}</View>)}
    </>
  );
}

function ProjectChat(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(["Hi Minh Anh, your start fee has been confirmed.", "Thank you. When will the designer be assigned?", "We are matching your project with an available senior designer now."]);
  const send = () => { if (message.trim()) { setMessages((current) => [...current, message.trim()]); setMessage(""); } };
  return (
    <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={s.fill} contentContainerStyle={s.messageArea}>
        <Text style={s.centerMuted}>TODAY · AUG 24</Text>
        {messages.map((item, index) => <View key={`${item}-${index}`} style={[s.bubble, index % 2 ? s.bubbleOther : s.bubbleOwn]}><Text style={[s.bubbleText, index % 2 ? null : s.bubbleOwnText]}>{item}</Text><Text style={[s.bubbleTime, index % 2 ? null : { color: "rgba(255,255,255,.55)" }]}>{index === messages.length - 1 ? "10:42" : "10:30"}</Text></View>)}
      </ScrollView>
      <View style={[s.composer, { paddingBottom: Math.max(insets.bottom, 9) }]}>
        <AppIcon definition={paperclipIconDefinition} size={19} color={SALE.muted} />
        <TextInput multiline value={message} onChangeText={setMessage} placeholder="Write a message…" placeholderTextColor="rgba(122,111,104,.5)" style={s.composerInput} />
        <Pressable style={s.send} onPress={send}><AppIcon definition={sendIconDefinition} size={16} color={SALE.white} /></Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function SchedulesTab({ onCreate }: { onCreate: () => void }): React.JSX.Element {
  return (
    <>
      <View style={s.sectionRow}><Text style={s.sectionLabel}>2 schedules</Text><Pressable style={{ flexDirection: "row", gap: 4 }} onPress={onCreate}><AppIcon definition={plusIconDefinition} size={13} color={SALE.gold} /><Text style={s.sectionAction}>Create Schedule</Text></Pressable></View>
      <ScheduleCard title="Initial Consultation" status="Completed" date="Aug 18, 2026" time="10:00–11:30" type="Consultation" />
      <ScheduleCard title="Site Measurement Visit" status="Pending Confirmation" date="Aug 26, 2026" time="09:00–12:00" type="Measurement" />
      <Pressable style={[s.card, s.dashed]} onPress={onCreate}><Text style={s.bodyText}>Schedule a site measurement visit</Text><Text style={[s.sectionAction, { marginTop: 7 }]}>＋ Add Measurement Schedule</Text></Pressable>
    </>
  );
}

function ScheduleCard({ title, status, date, time, type }: { title: string; status: string; date: string; time: string; type: string }): React.JSX.Element {
  return <View style={s.card}><View style={s.topCardRow}><Text style={s.cardTitle}>{title}</Text><View style={s.status}><Text style={s.statusText}>{status}</Text></View></View><View style={s.scheduleRow}><View style={s.scheduleMeta}><AppIcon definition={calendarIconDefinition} size={13} color={SALE.muted} /><Text style={s.infoValue}>{date}</Text></View><View style={s.scheduleMeta}><AppIcon definition={clockIconDefinition} size={13} color={SALE.muted} /><Text style={s.infoValue}>{time}</Text></View></View><View style={s.buttonRow}><View style={[s.status, { borderWidth: 0, backgroundColor: SALE.pale }]}><Text style={[s.statusText, { color: SALE.muted }]}>{type}</Text></View><Pressable><Text style={s.buttonSecondaryText}>Reschedule</Text></Pressable></View></View>;
}

function CreateScheduleModal({ visible, onClose }: { visible: boolean; onClose: () => void }): React.JSX.Element {
  const [type, setType] = useState("Consultation");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const canCreate = title.trim().length > 0;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.modalBackdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={s.sheetHandle} />
          <View style={s.sheetHeader}><View><Text style={s.sheetTitle}>New Schedule</Text><Text style={s.cardMeta}>PRJ-2026-014</Text></View><Pressable style={s.settingIcon} onPress={onClose}><Text style={{ color: SALE.muted, fontSize: 18 }}>×</Text></Pressable></View>
          <View style={s.sheetBody}>
            <View style={s.typeRow}>{["Consultation", "Measurement"].map((item) => <Pressable key={item} style={[s.typeOption, type === item && s.typeSelected]} onPress={() => setType(item)}><Text style={[s.chipText, type === item && { color: "#432DD7" }]}>{item}</Text></Pressable>)}</View>
            <TextInput value={title} onChangeText={setTitle} placeholder="Schedule title" placeholderTextColor="rgba(122,111,104,.5)" style={s.sheetInput} />
            <View style={s.dateRow}><View style={s.dateField}><Text style={s.dateText}>Aug 26, 2026</Text></View><View style={s.dateField}><Text style={s.dateText}>09:00</Text></View><View style={s.dateField}><Text style={s.dateText}>12:00</Text></View></View>
            <TextInput value={location} onChangeText={setLocation} placeholder="Location or meeting link" placeholderTextColor="rgba(122,111,104,.5)" style={s.sheetInput} />
            <View style={s.typeRow}><Pressable style={[s.buttonSecondary, { height: 41 }]} onPress={onClose}><Text style={s.buttonSecondaryText}>Cancel</Text></Pressable><Pressable disabled={!canCreate} style={[s.buttonPrimary, { height: 41, flex: 2 }, !canCreate && { backgroundColor: "rgba(122,111,104,.2)" }]} onPress={onClose}><Text style={s.buttonPrimaryText}>Create</Text></Pressable></View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function SaleChatScreen({ route, navigation }: ChatProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const conversation = saleConversations.find((item) => item.id === route.params.conversationId) ?? saleConversations[0];
  const [message, setMessage] = useState("");
  const [items, setItems] = useState(["Xin chào, tôi muốn hỏi về tiến độ hiện tại.", "Chào anh/chị. Phí khởi động đã được xác nhận và chúng tôi đang phân công designer.", "Khi nào tôi có thể nhận được lịch đo đạc?", "Dự kiến ngày 26/08. Tôi sẽ gửi xác nhận trong hôm nay."]);
  const send = () => { if (message.trim()) { setItems((current) => [...current, message.trim()]); setMessage(""); } };
  return (
    <SaleFrame>
      <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[s.header, { paddingTop: Math.max(insets.top, 18) + 8 }]}>
          <View style={s.detailHeaderTop}>
            <Pressable style={s.backButton} onPress={() => navigation.goBack()}><Text style={{ color: SALE.white, fontSize: 19 }}>‹</Text></Pressable>
            <Avatar initials={conversation.initials} color={conversation.color} size={36} />
            <View style={s.detailTitleWrap}><Text style={s.detailTitle}>{conversation.name}</Text><Text style={s.headerSubtitle}>{conversation.meta} · Online</Text></View>
            <AppIcon definition={phoneIconDefinition} size={18} color={SALE.white} />
          </View>
        </View>
        <ScrollView style={s.fill} contentContainerStyle={s.messageArea} keyboardShouldPersistTaps="handled">
          <Text style={s.centerMuted}>TODAY · AUG 24</Text>
          {items.map((item, index) => { const own = index % 2 === 1 || index === items.length - 1 && items.length > 4; return <View key={`${item}-${index}`} style={[s.bubble, own ? s.bubbleOwn : s.bubbleOther]}><Text style={[s.bubbleText, own && s.bubbleOwnText]}>{item}</Text><Text style={[s.bubbleTime, own && { color: "rgba(255,255,255,.55)" }]}>{10 + index}:3{index}</Text></View>; })}
        </ScrollView>
        <View style={[s.composer, { paddingBottom: Math.max(insets.bottom, 9) }]}><AppIcon definition={paperclipIconDefinition} size={19} color={SALE.muted} /><TextInput multiline value={message} onChangeText={setMessage} placeholder="Write a message…" placeholderTextColor="rgba(122,111,104,.5)" style={s.composerInput} /><Pressable style={s.send} onPress={send}><AppIcon definition={sendIconDefinition} size={16} color={SALE.white} /></Pressable></View>
      </KeyboardAvoidingView>
    </SaleFrame>
  );
}

function Info({ label, value }: { label: string; value: string }): React.JSX.Element {
  return <View style={s.infoCell}><Text style={s.infoLabel}>{label}</Text><Text style={s.infoValue}>{value}</Text></View>;
}
