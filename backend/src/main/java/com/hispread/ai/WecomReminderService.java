package com.hispread.ai;

import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;

/** Legacy settings are retained in storage, but the delivery product never sends robot messages. */
@Service
public class WecomReminderService {
  private final Store s;
  public WecomReminderService(Store s) { this.s = s; }
  public ObjectNode settings() {
    return s.object().put("retired", true).put("configured", false).put("webhookUrl", "");
  }
  public boolean configured() { return false; }
  public ObjectNode save(ObjectNode body) { throw TaskScope.retired(); }
  public ObjectNode send(ObjectNode task) { throw TaskScope.retired(); }
}
