# Approved Tool Registry

| Tool | Mode | Bound skill | Authorization |
|---|---|---|---|
| get_payment | READ | SK-02 | Case exists |
| get_order | READ | SK-02 | Case exists |
| get_refund | READ | SK-02 | Case exists |
| get_customer | READ | SK-02 | Case exists |
| get_ticket | READ | SK-02 | Case exists |
| get_system_events | READ | SK-02 | Case exists |
| search_policy | READ | SK-03 | Domain identified |
| execute_refund | WRITE | SK-06 | Trust Layer AUTO_ALLOWED |
| request_customer_info | WRITE | SK-06 | Trust Layer authorization |
| escalate_case | WRITE | SK-06 | Trust Layer authorization |
| update_ticket_status | WRITE | SK-06 | Trust Layer authorization |
| create_incident | WRITE | SK-06 | Trust Layer authorization |

Qwen may request only the seven read tools. The application rejects unlisted requests and never exposes write tool execution to Qwen.
