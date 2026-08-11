import enum


class BloodGroupEnum(str, enum.Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"


class SexEnum(str, enum.Enum):
    MALE = "M"
    FEMALE = "F"
    OTHER = "O"


class ComponentTypeEnum(str, enum.Enum):
    WHOLE_BLOOD = "whole_blood"
    PRBC = "prbc"
    PLATELETS = "platelets"
    FFP = "ffp"
    CRYO = "cryo"
    GRANULOCYTES = "granulocytes"


class UnitLifecycleState(str, enum.Enum):
    COLLECTED = "collected"
    TESTED = "tested"
    SEPARATED = "separated"
    STORED = "stored"
    RESERVED = "reserved"
    ISSUED = "issued"
    TRANSFUSED = "transfused"
    DISCARDED = "discarded"
    EXPIRED = "expired"


class UnitReleaseStatus(str, enum.Enum):
    PENDING = "pending"
    RELEASED = "released"
    REJECTED = "rejected"
    QUARANTINE = "quarantine"


class ComponentStateEnum(str, enum.Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    ISSUED = "issued"
    TRANSFUSED = "transfused"
    DISCARDED = "discarded"
    EXPIRED = "expired"


class TestResultEnum(str, enum.Enum):
    REACTIVE = "reactive"
    NON_REACTIVE = "non_reactive"
    INDETERMINATE = "indeterminate"


class EligibilityResultEnum(str, enum.Enum):
    ELIGIBLE = "eligible"
    TEMPORARILY_DEFERRED = "temporarily_deferred"
    PERMANENTLY_DEFERRED = "permanently_deferred"


class CampStatusEnum(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class RequisitionStatusEnum(str, enum.Enum):
    PENDING = "pending"
    PARTIALLY_RESERVED = "partially_reserved"
    FULLY_RESERVED = "fully_reserved"
    PARTIALLY_ISSUED = "partially_issued"
    ISSUED = "issued"
    CANCELLED = "cancelled"


class RequisitionPriorityEnum(str, enum.Enum):
    ROUTINE = "routine"
    URGENT = "urgent"
    EMERGENCY = "emergency"


class LedgerReasonEnum(str, enum.Enum):
    COLLECTION = "collection"
    RESERVE = "reserve"
    UNRESERVE = "unreserve"
    ISSUE = "issue"
    TRANSFUSED = "transfused"
    DISCARD = "discard"
    EXPIRY = "expiry"
    TRANSFER_IN = "transfer_in"
    TRANSFER_OUT = "transfer_out"
    ADJUSTMENT = "adjustment"


class WalletTxnTypeEnum(str, enum.Enum):
    EARN = "earn"
    REDEEM = "redeem"
    EXPIRE = "expire"
    ADJUST = "adjust"


class NotificationChannelEnum(str, enum.Enum):
    WHATSAPP = "whatsapp"
    SMS = "sms"
    IN_APP = "in_app"


class NotificationStatusEnum(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"


class AuditActorType(str, enum.Enum):
    USER = "user"
    SYSTEM = "system"
    SYNC_AGENT = "sync_agent"


class SyncStatusEnum(str, enum.Enum):
    PENDING = "pending"
    PROCESSED = "processed"
    CONFLICT = "conflict"
    ERROR = "error"


class DonorStatusEnum(str, enum.Enum):
    ACTIVE = "active"
    TEMPORARILY_DEFERRED = "temporarily_deferred"
    PERMANENTLY_DEFERRED = "permanently_deferred"


class UserRoleEnum(str, enum.Enum):
    ADMIN = "admin"
    MEDICAL_OFFICER = "medical_officer"
    LAB_TECH = "lab_tech"
    PHLEBOTOMIST = "phlebotomist"
    INVENTORY_OFFICER = "inventory_officer"
    ORGANIZER = "organizer"
    DONOR = "donor"
    CITIZEN_READ = "citizen_read"
