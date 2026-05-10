import defusedxml.ElementTree as ET
import xml.etree.ElementTree as standard_ET
import defusedxml

# A payload that would normally trigger an external entity resolution
xml_payload = """<?xml version="1.0"?>
<!DOCTYPE root [
  <!ENTITY test SYSTEM "file:///etc/passwd">
]>
<root>
  <data>&test;</data>
</root>
"""

def test_standard_etree():
    try:
        root = standard_ET.fromstring(xml_payload)
        print("Standard ElementTree parsed it (Warning: Might be vulnerable depending on environment)")
        return False
    except Exception as e:
        print(f"Standard ElementTree raised: {type(e).__name__}")
        return True

def test_defusedxml():
    try:
        root = ET.fromstring(xml_payload)
        print("defusedxml successfully parsed the payload? This shouldn't happen.")
        return False
    except defusedxml.EntitiesForbidden as e:
        print("Success! defusedxml blocked external entities (EntitiesForbidden raised).")
        return True
    except Exception as e:
        print(f"defusedxml raised another exception: {type(e).__name__}: {e}")
        return True

if __name__ == "__main__":
    print("Testing standard ElementTree:")
    test_standard_etree()

    print("\nTesting defusedxml.ElementTree:")
    result = test_defusedxml()

    if result:
        print("\nAll tests passed!")
        exit(0)
    else:
        print("\nTest failed!")
        exit(1)
