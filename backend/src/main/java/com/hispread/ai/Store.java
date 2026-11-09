package com.hispread.ai;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.time.Instant;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class Store {
  public final JdbcTemplate jdbc;
  public final ObjectMapper json;

  public Store(JdbcTemplate jdbc, ObjectMapper json) {
    this.jdbc = jdbc;
    this.json = json;
  }

  public ObjectNode object() {
    return json.createObjectNode();
  }

  public ObjectNode parse(String s) {
    try {
      return (ObjectNode) json.readTree(s);
    } catch (Exception e) {
      throw new IllegalStateException("Invalid stored record", e);
    }
  }

  public List<ObjectNode> list(String kind, String owner) {
    return owner == null
        ? jdbc.query(
            "select data from hub_entity where kind=? order by created_at desc,id",
            (r, n) -> parse(r.getString(1)),
            kind)
        : jdbc.query(
            "select data from hub_entity where kind=? and owner_id=? order by created_at desc,id",
            (r, n) -> parse(r.getString(1)),
            kind,
            owner);
  }

  public ObjectNode get(String kind, String id, String owner) {
    return list(kind, owner).stream()
        .filter(x -> id.equals(x.path("id").asText()))
        .findFirst()
        .orElseThrow(() -> new ApiException(404, "记录不存在或无权访问"));
  }

  public ObjectNode create(String kind, String owner, ObjectNode data) {
    ObjectNode d = data.deepCopy();
    String id = d.path("id").asText(UUID.randomUUID().toString());
    d.put("id", id);
    d.put("version", 0);
    if (!d.has("createdAt")) d.put("createdAt", Instant.now().toString());
    jdbc.update(
        "insert into hub_entity(id,kind,owner_id,data,version) values(?,?,?,cast(? as jsonb),0)",
        id,
        kind,
        owner == null ? "GLOBAL" : owner,
        d.toString());
    return d;
  }

  public ObjectNode update(String kind, String id, String owner, ObjectNode patch) {
    ObjectNode old = get(kind, id, owner);
    long version = old.path("version").asLong(0);
    if (patch.has("version") && patch.path("version").asLong() != version)
      throw new ApiException(409, "记录已更新，请刷新后重试");
    ObjectNode d = old.deepCopy();
    patch
        .fields()
        .forEachRemaining(
            e -> {
              if (!Set.of("id", "ownerId", "supplierId", "createdAt").contains(e.getKey()))
                d.set(e.getKey(), e.getValue());
            });
    d.put("id", id);
    d.put("version", version + 1);
    d.put("updatedAt", Instant.now().toString());
    int n =
        jdbc.update(
            "update hub_entity set data=cast(? as jsonb),version=?,updated_at=now() where kind=?"
                + " and id=? and version=? and (cast(? as varchar) is null or owner_id=?)",
            d.toString(),
            version + 1,
            kind,
            id,
            version,
            owner,
            owner);
    if (n == 0) throw new ApiException(409, "记录已更新，请刷新后重试");
    return d;
  }

  public void delete(String kind, String id, String owner) {
    get(kind, id, owner);
    jdbc.update(
        "delete from hub_entity where kind=? and id=? and (cast(? as varchar) is null or"
            + " owner_id=?)",
        kind,
        id,
        owner,
        owner);
  }

  public ObjectNode page(List<ObjectNode> items, int page, int size) {
    page = Math.max(1, page);
    size = Math.max(1, Math.min(100, size));
    ObjectNode d = object();
    d.set(
        "items",
        json.valueToTree(
            items.subList(
                Math.min(items.size(), (page - 1) * size), Math.min(items.size(), page * size))));
    d.put("total", items.size());
    d.put("page", page);
    d.put("size", size);
    return d;
  }

  public void seed(String kind, String owner, ObjectNode data) {
    if (data.has("id")
        && jdbc.queryForObject(
                "select count(*) from hub_entity where kind=? and id=?",
                Integer.class,
                kind,
                data.path("id").asText())
            > 0) return;
    create(kind, owner, data);
  }
}
