package com.hispread.ai;

import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.*;
import java.nio.file.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
  private final Store s;
  private final AuthService a;
  private final AccessPolicy access;

  @Value("${app.uploads}")
  String directory;

  public DocumentController(Store s, AuthService a, AccessPolicy access) {
    this.s = s;
    this.a = a;
    this.access = access;
  }

  private void readable(ObjectNode doc, HttpServletRequest r) {
    if (access.isPaymentProof(doc)) {
      if (access.operator(r) || access.member(r)) throw new ApiException(404, "文件不存在或无权访问");
      if (a.platform(r)) a.requirePlatform(r, "payment.read");
      else a.require(r, "payment.read");
    } else {
      if (a.platform(r) && !a.admin(r) && !access.operator(r))
        throw new ApiException(404, "文件不存在或无权访问");
      if (!access.member(r)) a.require(r, "supplier.read");
      else a.require(r, "resource.read");
    }
  }

  @GetMapping
  public Object list(@RequestParam String supplierId, HttpServletRequest r) {
    access.requireSupplier(r, supplierId);
    List<ObjectNode> out = new ArrayList<>();
    for (ObjectNode row : access.visible("document", r))
      if (access.entityOwner("document", row.path("id").asText(), r).equals(supplierId))
        try {
          readable(row, r);
          out.add(access.publicRecord("document", row, r));
        } catch (ApiException denied) {
        }
    return out;
  }

  @PostMapping
  public Object upload(
      @RequestParam String supplierId,
      @RequestParam(defaultValue = "QUALIFICATION") String category,
      @RequestParam MultipartFile file,
      HttpServletRequest r)
      throws Exception {
    a.require(r, "file.write");
    access.requireSupplier(r, supplierId);
    if (access.member(r)) throw new ApiException(403, "成员账号不可上传主体资质或财务凭证");
    if (!Set.of("QUALIFICATION", "PAYMENT_PROOF").contains(category))
      throw new ApiException(400, "不支持的文档类别");
    if (category.equals("PAYMENT_PROOF")) {
      if (!a.platform(r) || access.operator(r)) throw new ApiException(403, "仅财务平台账号可上传付款凭证");
      a.requirePlatform(r, "payment.create");
    } else if (a.platform(r)) {
      if (!a.admin(r) && !access.operator(r)) throw new ApiException(403, "无权维护主体资质");
      a.require(r, "supplier.write");
    }
    if (file.isEmpty()
        || file.getSize() > 10 * 1024 * 1024
        || !Set.of("image/png", "image/jpeg", "application/pdf").contains(file.getContentType()))
      throw new ApiException(400, "文件需为10MB以内PDF/PNG/JPG");
    String id = UUID.randomUUID().toString();
    Path root = Path.of(directory).toAbsolutePath().normalize();
    Files.createDirectories(root);
    Files.copy(file.getInputStream(), root.resolve(id));
    ObjectNode data =
        s.object()
            .put("id", id)
            .put("supplierId", supplierId)
            .put("createdBy", a.userId(r))
            .put("category", category)
            .put(
                "filename",
                Path.of(Objects.requireNonNullElse(file.getOriginalFilename(), "file"))
                    .getFileName()
                    .toString())
            .put("contentType", file.getContentType())
            .put("size", file.getSize());
    return access.publicRecord("document", s.create("document", supplierId, data), r);
  }

  @GetMapping("/{id}/download")
  public ResponseEntity<?> download(@PathVariable String id, HttpServletRequest r)
      throws Exception {
    ObjectNode doc = access.get("document", id, r);
    readable(doc, r);
    Path file = Path.of(directory).toAbsolutePath().normalize().resolve(id).normalize();
    if (!Files.isRegularFile(file)) throw new ApiException(404, "文件不存在");
    return ResponseEntity.ok()
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            ContentDisposition.attachment()
                .filename(doc.path("filename").asText(), java.nio.charset.StandardCharsets.UTF_8)
                .build()
                .toString())
        .contentType(MediaType.parseMediaType(doc.path("contentType").asText()))
        .body(new FileSystemResource(file));
  }
}
