"""Organizer directory contacts sourced from Red Cross Durg Hindi outreach lists.

Categories map to OrgCategoryEnum. Seed a representative cross-section
(~30 orgs) plus optional full list helpers for staff directory.
"""

from __future__ import annotations

import asyncio

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.enums import OrgCategoryEnum

# (source_serial, category, org_name, contact_role, location, mobile)
DIRECTORY_ROWS: list[tuple[int, OrgCategoryEnum, str, str | None, str | None, str | None]] = [
    # विभिन्न समाज
    (1, OrgCategoryEnum.COMMUNITY_SOCIETY, "शदाणी युवा मंच", "अध्यक्ष", "दुर्ग", "9893482620"),
    (2, OrgCategoryEnum.COMMUNITY_SOCIETY, "अग्रवाल यूथ क्लब", None, "दुर्ग", "9827476558"),
    (3, OrgCategoryEnum.COMMUNITY_SOCIETY, "श्री गुरु सिंह सभा", None, "दुर्ग", "8889999913"),
    (7, OrgCategoryEnum.COMMUNITY_SOCIETY, "सिख समाज", None, "भिलाई", "9425235588"),
    (15, OrgCategoryEnum.COMMUNITY_SOCIETY, "मुस्लिम समाज", None, "दुर्ग", "9893308786"),
    (31, OrgCategoryEnum.COMMUNITY_SOCIETY, "यूनाइटेड क्रिश्चियन काउंसिल", "जनरल सेक्रेटरी", "दुर्ग", "9827173359"),
    # सामाजिक संस्थाएं
    (34, OrgCategoryEnum.SOCIAL_ORG, "प्रजापिता ब्रम्हकुमारी विश्वविद्यालय", None, "दुर्ग", "9425552349"),
    (37, OrgCategoryEnum.SOCIAL_ORG, "संत निरंकारी फाउंडेशन", None, "दुर्ग", "9425237890"),
    (47, OrgCategoryEnum.SOCIAL_ORG, "हेल्पिंग फ्रेंड्स क्लब", None, "दुर्ग", "9770047209"),
    (48, OrgCategoryEnum.SOCIAL_ORG, "बी.एस.पी. एम्पलॉयी वेलफेयर एसोसिएशन", None, "भिलाई", "8709360081"),
    (53, OrgCategoryEnum.SOCIAL_ORG, "ब्लड इंटीग्रेटेड एक्टिविटीज लाइफ सर्विसेस", None, "भिलाई", "9301712355"),
    # पुलिस / अर्द्धसैनिक
    (54, OrgCategoryEnum.POLICE_PARAMILITARY, "जिला पुलिस बल", None, "दुर्ग", "9406159055"),
    (60, OrgCategoryEnum.POLICE_PARAMILITARY, "37 सी.जी. बटालियन एन.सी.सी.", None, "दुर्ग", "9926529533"),
    (61, OrgCategoryEnum.POLICE_PARAMILITARY, "बी.एस.एफ. रिसाली", None, "भिलाई", "7540072333"),
    # शासकीय संघ
    (62, OrgCategoryEnum.GOVT_UNION, "शासकीय कर्मचारी/अधिकारी संघ", None, "दुर्ग", "9826105173"),
    (63, OrgCategoryEnum.GOVT_UNION, "छ.ग. स्वास्थ्य कर्मचारी संघ", None, "दुर्ग", "9827969886"),
    (73, OrgCategoryEnum.GOVT_UNION, "मितानिन संघ", None, "दुर्ग", "7000631945"),
    # शैक्षणिक
    (82, OrgCategoryEnum.EDUCATIONAL, "अपोलो कॉलेज", "संचालक", "दुर्ग", "9425242178"),
    (83, OrgCategoryEnum.EDUCATIONAL, "रूंगटा कॉलेज ऑफ इंजीनियरिंग एण्ड टेक्नोलॉजी", None, "दुर्ग", "9425555100"),
    (89, OrgCategoryEnum.EDUCATIONAL, "आई.आई.टी. भिलाई", "डायरेक्टर", "भिलाई", "8240422509"),
    (92, OrgCategoryEnum.EDUCATIONAL, "बी.आई.टी. कॉलेज", "प्राचार्य", "दुर्ग", "9589072758"),
    # औद्योगिक
    (99, OrgCategoryEnum.INDUSTRIAL, "भिलाई स्टील प्लांट", None, "भिलाई", "9685193671"),
    (100, OrgCategoryEnum.INDUSTRIAL, "जे.के. लक्ष्मी सीमेंट अहिवारा", "प्रबंधक", "अहिवारा", "8966909191"),
    (101, OrgCategoryEnum.INDUSTRIAL, "अडानी सीमेंट जामुल", "प्रबंधक", "जामुल", "9109915590"),
    # राजनीतिक
    (105, OrgCategoryEnum.POLITICAL, "भारतीय राष्ट्रीय कांग्रेस दुर्ग शहर", "जिला अध्यक्ष", "दुर्ग", "9425235611"),
    (111, OrgCategoryEnum.POLITICAL, "भारतीय जनता पार्टी", "जिला अध्यक्ष", "दुर्ग", "9630464555"),
    # अन्य
    (116, OrgCategoryEnum.OTHER, "अधिवक्ता संघ", "जिला अध्यक्ष", "दुर्ग", "9302830435"),
    (117, OrgCategoryEnum.OTHER, "प्रेस क्लब", None, "दुर्ग", "9302839034"),
    (120, OrgCategoryEnum.OTHER, "आई.एम.ए.", None, "दुर्ग", "6392812833"),
    (137, OrgCategoryEnum.OTHER, "भूतपूर्व सैनिक संघ", None, "दुर्ग", "9827159578"),
    # विभागीय अधिकारी (serial restarts on that sheet; offset with 200+)
    (201, OrgCategoryEnum.DEPARTMENTAL_OFFICER, "अपर कलेक्टर दुर्ग", "श्रीमती योगिता देवांगन", "दुर्ग", "9425589514"),
    (205, OrgCategoryEnum.DEPARTMENTAL_OFFICER, "मुख्य चिकित्सा एवं स्वास्थ्य अधिकारी", "डॉ. मनोज कुमार दानी", "दुर्ग", "9301050771"),
    (206, OrgCategoryEnum.DEPARTMENTAL_OFFICER, "जिला कार्यक्रम प्रबंधक, एन.एच.एम.", "डॉ. भूमिका वर्मा", "दुर्ग", "9981605865"),
    (223, OrgCategoryEnum.DEPARTMENTAL_OFFICER, "आयुक्त, नगर निगम दुर्ग", "श्री सुमित अग्रवाल", "दुर्ग", "9907986830"),
]


ORGANIZER_ACCOUNT_PASSWORD = "org123"


async def seed_organizer_directory(db) -> int:
    """Upsert directory rows by (source_serial, org_name). Returns inserted count."""
    from sqlalchemy import text

    inserted = 0
    for serial, category, org_name, role, location, mobile in DIRECTORY_ROWS:
        existing = await db.execute(
            text(
                "SELECT id FROM organizer_directory "
                "WHERE source_serial = :serial AND org_name = :name LIMIT 1"
            ),
            {"serial": serial, "name": org_name},
        )
        if existing.scalar_one_or_none():
            continue
        await db.execute(
            text("""
                INSERT INTO organizer_directory
                    (id, category, org_name, contact_role, location, mobile, source_serial, created_at)
                VALUES
                    (gen_random_uuid(), :cat, :name, :role, :loc, :mobile, :serial, now())
            """),
            {
                "cat": category.value,
                "name": org_name,
                "role": role,
                "loc": location,
                "mobile": mobile,
                "serial": serial,
            },
        )
        inserted += 1
    return inserted


async def seed_organizer_accounts(db, *, password: str = ORGANIZER_ACCOUNT_PASSWORD) -> int:
    """Create User(role=organizer) + Organizer profile for each directory contact.

    Usernames: org_<source_serial>  (e.g. org_1, org_99, org_201)
    Password: org123 (shared demo password)
    Returns number of newly created accounts.
    """
    from sqlalchemy import text

    from app.services.auth import hash_password

    hashed = hash_password(password)
    created = 0

    for serial, category, org_name, role, location, mobile in DIRECTORY_ROWS:
        username = f"org_{serial}"
        existing = await db.execute(
            text("SELECT id FROM users WHERE username = :u LIMIT 1"),
            {"u": username},
        )
        user_id = existing.scalar_one_or_none()
        if user_id is None:
            row = await db.execute(
                text("""
                    INSERT INTO users (id, facility_id, role, username, email, phone, hashed_password,
                                       display_name, is_active, created_at, updated_at)
                    VALUES (gen_random_uuid(), NULL, 'organizer', :username, :email, :phone, :hashed,
                            :display, true, now(), now())
                    RETURNING id
                """),
                {
                    "username": username,
                    "email": f"{username}@rakt.local",
                    "phone": mobile or f"90000{serial:05d}"[:20],
                    "hashed": hashed,
                    "display": org_name[:100],
                },
            )
            user_id = row.scalar_one()
            created += 1
        else:
            # Ensure role stays organizer for directory-backed accounts
            await db.execute(
                text("UPDATE users SET role = 'organizer', display_name = :d, phone = COALESCE(phone, :p) WHERE id = :id"),
                {"d": org_name[:100], "p": mobile, "id": str(user_id)},
            )

        org_existing = await db.execute(
            text("SELECT id FROM organizers WHERE user_id = :uid LIMIT 1"),
            {"uid": str(user_id)},
        )
        if org_existing.scalar_one_or_none() is None:
            await db.execute(
                text("""
                    INSERT INTO organizers (id, user_id, org_name, org_type, org_category, contact_name,
                                            contact_role, contact_phone, contact_email, contact_address,
                                            address, is_verified, created_at, updated_at)
                    VALUES (gen_random_uuid(), :uid, :oname, :otype, :ocat, :contact, :role, :phone, :email,
                            :caddr, :addr, true, now(), now())
                """),
                {
                    "uid": str(user_id),
                    "oname": org_name,
                    "otype": "ngo",
                    "ocat": category.value,
                    "contact": role or org_name,
                    "role": role,
                    "phone": mobile,
                    "email": f"{username}@rakt.local",
                    "caddr": location,
                    "addr": location,
                },
            )
        else:
            await db.execute(
                text("""
                    UPDATE organizers
                    SET org_name = :oname, org_category = :ocat, contact_role = :role,
                        contact_phone = :phone, contact_address = :caddr, address = :addr,
                        is_verified = true, updated_at = now()
                    WHERE user_id = :uid
                """),
                {
                    "uid": str(user_id),
                    "oname": org_name,
                    "ocat": category.value,
                    "role": role,
                    "phone": mobile,
                    "caddr": location,
                    "addr": location,
                },
            )

    return created


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as db:
        count = await seed_organizer_directory(db)
        await db.commit()
        print(f"Organizer directory: inserted {count} contacts")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
