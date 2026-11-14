package com.hispread.ai;

import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import org.springframework.stereotype.Service;

/** Retired gateway monitoring. Stored sources remain available only through historical reads. */
@Service
public class MonitoringService {
  public void validate(ObjectNode source) { throw TaskScope.retired(); }
  public ObjectNode refresh(String id) { throw TaskScope.retired(); }
  public List<ObjectNode> snapshots(boolean supplier) { return List.of(); }
  public void collectDue() {}
}
