import pytest
from decimal import Decimal
from app.services.bakong_service import BakongService, calculate_crc16, format_tlv


def test_calculate_crc16():
    # Test vector standard
    test_str = "0002010102126304"
    crc = calculate_crc16(test_str)
    assert len(crc) == 4
    assert all(c in "0123456789ABCDEF" for c in crc)


def test_format_tlv():
    res = format_tlv("53", "840")
    assert res == "5303840"

    res_merchant = format_tlv("59", "STORE KH")
    assert res_merchant == "5908STORE KH"


def test_generate_khqr_payload():
    result = BakongService.generate_khqr(
        amount=Decimal("5.50"),
        bill_number="ORDER_99",
        currency="USD",
        account_id="sopha@abaa",
        merchant_name="TEST STORE",
        merchant_city="PHNOM PENH",
    )

    assert "khqr_string" in result
    assert "md5" in result
    assert "qr_url" in result

    khqr = result["khqr_string"]
    assert khqr.startswith("000201010212")
    assert "sopha@abaa" in khqr
    assert "54045.50" in khqr
    assert "5802KH" in khqr
    assert "9934" in khqr  # Tag 99 timestamp + 24h expiration
    assert "expires_at_ms" in result
    assert len(result["md5"]) == 32

